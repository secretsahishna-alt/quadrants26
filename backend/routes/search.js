const express = require("express");
const { client } = require("../services/opensearch");
const router = express.Router();
router.get("/", async (req, res) => {
    try {
        const query = req.query.q;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }

        const response = await client.search({
            index: "products",
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["name", "description", "seller_name", "locality"],
                        fuzziness: "AUTO",
                    },
                },
            },
        });

        const result = response.body ?? response;

        res.json({
            success: true,
            count: result.hits.total.value,
            products: result.hits.hits.map((hit) => hit._source),
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
