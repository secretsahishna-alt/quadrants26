const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const orderRoutes = require("./routes/orders");
const express = require("express");
const cors = require("cors");
const pool = require("./db/postgres");
const app = express();
const { producer, kafkaError } = require("./services/kafka");

const allowedOrigins = new Set([
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    ...(process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
]);

app.use(cors({
    origin(origin, callback) {
        callback(null, !origin || allowedOrigins.has(origin));
    },
}));
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
app.use("/api/search", require("./routes/search"));
const PORT = Number(process.env.PORT) || 5003;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (kafkaError) {
        console.warn(`Kafka is unavailable; orders can still be saved: ${kafkaError.message}`);
        return;
    }

    producer.connect()
        .then(() => console.log("Kafka producer connected successfully"))
        .catch((error) => console.error("Kafka connection failed; orders can still be saved:", error.message));
});

server.on("error", (error) => {
    console.error("Backend server failed to start:", error.message);
    process.exitCode = 1;
});

process.on("SIGTERM", () => {
    server.close(async () => {
        await producer.disconnect().catch((error) => {
            console.error("Kafka disconnect failed:", error.message);
        });
        await pool.end();
    });
});
