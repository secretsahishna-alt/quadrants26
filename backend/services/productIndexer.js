const pool = require("../db/postgres");
const { client } = require("./opensearch");
const INDEX_NAME = "products";
async function fetchProducts() {
    const query = `
        SELECT
            p.id,
            p.name,
            p.description,
            p.price_paise,
            p.stock,
            p.seller_id,
            s.name AS seller_name,
            s.locality,
            s.address AS seller_address
        FROM products p
        JOIN sellers s ON p.seller_id = s.id
    `;

    const result = await pool.query(query);

    return result.rows;
}
async function createIndex() {
    const exists = await client.indices.exists({
        index: INDEX_NAME,
    });

    if (!exists.body) {
        await client.indices.create({
            index: INDEX_NAME,
        });

        console.log(`Created OpenSearch index: ${INDEX_NAME}`);
    } else {
        console.log(`OpenSearch index already exists: ${INDEX_NAME}`);
    }
}
async function indexProducts(products) {
    if (products.length === 0) {
        console.log("No products found to index.");
        return;
    }

    const body = products.flatMap((product) => [
        {
            index: {
                _index: INDEX_NAME,
                _id: product.id,
            },
        },
        product,
    ]);

    const response = await client.bulk({ body });
    const result = response.body ?? response;

    if (result.errors) {
        console.error("Some products could not be indexed.");
        console.error(result.items);
    } else {
        console.log(`Successfully indexed ${products.length} products.`);
    }
}
async function runProductIndexer() {
    try {
        await createIndex();

        const products = await fetchProducts();

        console.log(`Found ${products.length} products in PostgreSQL.`);

        await indexProducts(products);
    } catch (error) {
        console.error("Product indexing failed:", error.message);
        throw error;
    }
}
module.exports = {
    runProductIndexer,
};