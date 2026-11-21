
const express = require("express");
const router = express.Router();

const pool = require("../db/postgres");
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
        typeof customerPhone !== "string" ||
        !customerPhone.trim() ||
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

        console.log("Products retrieved:", productResult.rows);

        await client.query("ROLLBACK");

        return res.status(501).json({
            success: false,
            message: "Transaction connection tested. Order creation is not implemented yet."
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        console.error("Checkout error:", error);

        return res.status(500).json({
            success: false,
            message: "Checkout failed"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});
module.exports = router;
