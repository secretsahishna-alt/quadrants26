
const { Kafka } = require("kafkajs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Load Aiven's CA certificate
const caPath = path.resolve(__dirname, "../", process.env.KAFKA_CA_PATH);

const ca = fs.readFileSync(caPath, "utf8");

// Create Kafka client
const kafka = new Kafka({
    clientId: "quadrants26-backend",
    brokers: [process.env.KAFKA_BROKER],
    ssl: {
        ca: [ca],
    },
    sasl: {
        mechanism: process.env.KAFKA_MECHANISM,
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    },
});

// Create producer
const producer = kafka.producer();

// Create consumer
const consumer = kafka.consumer({
    groupId: "quadrants26-order-consumer",
});

module.exports = {
    kafka,
    producer,
    consumer,
};
