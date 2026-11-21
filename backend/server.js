const orderRoutes = require("./routes/orders");
const express = require("express");
const cors = require("cors");
const pool = require("./db/postgres");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Quadrants26 backend is running"
    });
});


app.get("/api/sellers", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, locality, address FROM sellers ORDER BY id"
        );

        res.json({
            success: true,
            sellers: result.rows
        });
    } catch (error) {
        console.error("Error fetching sellers:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sellers"
        });
    }
});

app.get("/api/products", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        p.id,
        p.seller_id AS "sellerId",
        s.name AS "sellerName",
        p.name,
        p.description,
        p.price_paise AS "pricePaise",
        p.stock
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      ORDER BY p.id
    `);

        res.json({
            success: true,
            products: result.rows
        });

    } catch (error) {
        console.error("Error fetching products:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
});

app.use("/api/orders", orderRoutes);
const PORT = 5002;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
