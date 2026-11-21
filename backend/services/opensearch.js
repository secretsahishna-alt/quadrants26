
const { Client } = require("@opensearch-project/opensearch");
const dotenv = require("dotenv");
const path = require("path");

// Load credentials from backend/.env
dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

// Read the Aiven connection URL
const OPENSEARCH_URL = process.env.OPENSEARCH_URL;

// Make sure the connection URL exists
if (!OPENSEARCH_URL) {
    throw new Error("OPENSEARCH_URL is missing from backend/.env");
}

// Create the OpenSearch client
const client = new Client({
    node: OPENSEARCH_URL
});

// Function to test the connection
async function checkOpenSearchConnection() {
    const response = await client.info();
    return response.body ?? response;
}

// Export the client and test function
module.exports = {
    client,
    checkOpenSearchConnection
};
