const express = require("express");
const { client } = require("../services/opensearch");
const pool = require("../db/postgres");
const router = express.Router();
router.get("/", async (req, res) => {
    try {
        const query = req.query.q;

        if (typeof query !== "string" || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }

        if (!client) {
            return res.status(503).json({
                success: false,
                message: "Search is not configured",
            });
        }

        const response = await client.search({
            index: "products",
            body: {
                query: {
                    multi_match: {
                        query: query.trim(),
                        fields: ["name", "description", "seller_name", "locality"],
                        fuzziness: "AUTO",
                    },
                },
            },
        });

        const result = response.body ?? response;
        const ids = result.hits.hits
            .map((hit) => Number(hit._source.id ?? hit._id))
            .filter((id) => Number.isSafeInteger(id) && id > 0);
        const productsResult = ids.length
            ? await pool.query(
                `SELECT p.id, p.seller_id AS "sellerId", s.name AS "sellerName",
                        p.name, p.description, p.price_paise AS "pricePaise", p.stock
                 FROM products p
                 JOIN sellers s ON p.seller_id = s.id
                 WHERE p.id = ANY($1::int[])`,
                [ids]
            )
            : { rows: [] };
        const productsById = new Map(productsResult.rows.map((product) => [product.id, product]));
        const products = ids.map((id) => productsById.get(id)).filter(Boolean);

        res.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Product search failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to search products",
        });
    }
});
module.exports = router;
