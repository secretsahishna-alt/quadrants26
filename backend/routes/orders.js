
const express = require("express");
const router = express.Router();

const pool = require("../db/postgres");
const { producer } = require("../services/kafka");
const MAX_ORDER_TOTAL_PAISE = 2147483647;
async function getDatabaseClient() {
    return await pool.connect();
}


router.post("/", async (req, res) => {
    const {
        customerName,
        customerPhone,
        fulfillmentType,
        deliveryAddress,
        items
    } = req.body || {};

    if (
        typeof customerName !== "string" ||
        !customerName.trim() ||
        customerName.trim().length > 100 ||
        typeof customerPhone !== "string" ||
        !customerPhone.trim() ||
        customerPhone.trim().length > 20 ||
        !["pickup", "delivery"].includes(fulfillmentType) ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid checkout information"
        });
    }

    if (
        fulfillmentType === "delivery" &&
        (typeof deliveryAddress !== "string" || !deliveryAddress.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "Delivery address is required"
        });
    }

    const validItems = items.every(
        (item) =>
            item !== null &&
            typeof item === "object" &&
            Number.isSafeInteger(item.productId) &&
            item.productId > 0 &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity > 0
    );

    if (!validItems) {
        return res.status(400).json({
            success: false,
            message: "Invalid product IDs or quantities"
        });
    }

    let client;
    let orderCommitted = false;
    let orderId;
    let totalPaise = 0;
    let createdAt;
    let createdSellerOrders = [];

    try {
        client = await getDatabaseClient();

        await client.query("BEGIN");

        const productIds = [...new Set(items.map(item => item.productId))].sort((a, b) => a - b);

        const productResult = await client.query(
            `SELECT id, seller_id, name, price_paise, stock
     FROM products
     WHERE id = ANY($1::int[])
     ORDER BY id
     FOR UPDATE`,
            [productIds]
        );

        if (productResult.rows.length !== productIds.length) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "One or more products do not exist"
            });
        }

        const productMap = new Map(
            productResult.rows.map(product => [product.id, product])
        );

        const requestedQuantities = new Map();

        for (const item of items) {
            requestedQuantities.set(
                item.productId,
                (requestedQuantities.get(item.productId) || 0) + item.quantity
            );
        }

        for (const [productId, quantity] of requestedQuantities) {
            const product = productMap.get(productId);

            if (!Number.isSafeInteger(quantity) || quantity > product.stock) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }
        }

        for (const [productId, quantity] of requestedQuantities) {
            const product = productMap.get(productId);

            const subtotal = product.price_paise * quantity;

            if (
                !Number.isSafeInteger(subtotal) ||
                !Number.isSafeInteger(totalPaise + subtotal) ||
                totalPaise + subtotal > MAX_ORDER_TOTAL_PAISE
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Order total exceeds the supported amount"
                });
            }

            totalPaise += subtotal;
        }

        const orderResult = await client.query(
            `INSERT INTO orders (
        customer_name,
        customer_phone,
        fulfillment_type,
        delivery_address,
        total_paise
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, created_at`,
            [
                customerName.trim(),
                customerPhone.trim(),
                fulfillmentType,
                fulfillmentType === "delivery"
                    ? deliveryAddress.trim()
                    : null,
                totalPaise
            ]
        );

        orderId = orderResult.rows[0].id;
        createdAt = orderResult.rows[0].created_at;

        const sellerGroups = new Map();

        for (const [productId, quantity] of requestedQuantities) {
            const product = productMap.get(productId);

            const sellerId = product.seller_id;
            const subtotalPaise = product.price_paise * quantity;

            if (!sellerGroups.has(sellerId)) {
                sellerGroups.set(sellerId, {
                    subtotalPaise: 0,
                    items: []
                });
            }

            const group = sellerGroups.get(sellerId);

            group.subtotalPaise += subtotalPaise;

            group.items.push({
                productId,
                quantity,
                unitPricePaise: product.price_paise
            });
        }

        for (const [sellerId, group] of sellerGroups) {
            const sellerOrderResult = await client.query(
                `INSERT INTO seller_orders (
            order_id,
            seller_id,
            subtotal_paise
        )
        VALUES ($1, $2, $3)
        RETURNING id`,
                [
                    orderId,
                    sellerId,
                    group.subtotalPaise
                ]
            );

            const sellerOrderId = sellerOrderResult.rows[0].id;

            createdSellerOrders.push({
                sellerOrderId,
                sellerId,
                subtotalPaise: group.subtotalPaise
            });
        }

        for (const sellerOrder of createdSellerOrders) {
            const group = sellerGroups.get(sellerOrder.sellerId);

            for (const item of group.items) {
                await client.query(
                    `INSERT INTO order_items (
                seller_order_id,
                product_id,
                quantity,
                unit_price_paise
            )
            VALUES ($1, $2, $3, $4)`,
                    [
                        sellerOrder.sellerOrderId,
                        item.productId,
                        item.quantity,
                        item.unitPricePaise
                    ]
                );
            }
        }

        for (const [productId, quantity] of requestedQuantities) {
            const updateResult = await client.query(
                `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1
         RETURNING id, stock`,
                [quantity, productId]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error(
                    `Inventory update failed for product ${productId}`
                );
            }
        }

        await client.query("COMMIT");
        orderCommitted = true;

        const orderEvent = {
            eventId: `order-${orderId}-${Date.now()}`,
            eventType: "order.created",
            data: {
                orderId,
                customer: { name: customerName },
                totalPaise,
                sellerOrders: createdSellerOrders
            }
        };
        Promise.resolve()
            .then(() => producer.send({
                topic: process.env.KAFKA_TOPIC || "orders.created",
                messages: [{
                    key: String(orderId),
                    value: JSON.stringify(orderEvent)
                }]
            }))
            .then(() => console.log("Order event published to Kafka:", orderId))
            .catch((kafkaError) => {
                console.error("Order saved, but Kafka publishing failed:", kafkaError.message);
            });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            orderId,
            createdAt,
            totalPaise,
            sellerOrders: createdSellerOrders,
            eventPublished: false,
            eventStatus: "pending"
        });

    } catch (error) {
        // Undo any unfinished database operations
        if (client && !orderCommitted) {
            await client.query("ROLLBACK").catch(console.error);
        }

        if (orderCommitted) {
            console.error("Post-commit error:", error);

            return res.status(201).json({
                success: true,
                message: "Order saved successfully",
                orderId,
                createdAt,
                totalPaise,
                sellerOrders: createdSellerOrders,
                eventPublished: false
            });
        }
        console.error("Checkout error:", error);


        return res.status(500).json({
            success: false,
            message: "Checkout failed"
        });

    } finally {
        // Return the connection to the PostgreSQL pool
        if (client) {
            client.release();
        }
    }
});
module.exports = router;
