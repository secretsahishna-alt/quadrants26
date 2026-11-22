require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const caPath = process.env.PGSSL_CA_PATH || process.env.KAFKA_CA_PATH;
const ssl = { rejectUnauthorized: true };
const ca = process.env.PGSSL_CA || process.env.KAFKA_CA;
if (ca) {
    ssl.ca = ca.replace(/\\n/g, "\n");
} else if (caPath) {
    ssl.ca = fs.readFileSync(path.resolve(__dirname, "..", caPath), "utf8");
}

const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl
});

module.exports = pool;