
const { Kafka } = require("kafkajs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const requiredConfig = [
    "KAFKA_BROKER",
    "KAFKA_CA_PATH",
    "KAFKA_MECHANISM",
    "KAFKA_USERNAME",
    "KAFKA_PASSWORD",
];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);
let kafka = null;
let kafkaError = null;

if (missingConfig.length === 0) {
    try {
        const caPath = path.resolve(__dirname, "../", process.env.KAFKA_CA_PATH);
        const ca = fs.readFileSync(caPath, "utf8");
        kafka = new Kafka({
            clientId: "quadrants26-backend",
            brokers: [process.env.KAFKA_BROKER],
            connectionTimeout: 10000,
            authenticationTimeout: 10000,
            ssl: { ca: [ca] },
            sasl: {
                mechanism: process.env.KAFKA_MECHANISM,
                username: process.env.KAFKA_USERNAME,
                password: process.env.KAFKA_PASSWORD,
            },
        });
    } catch (error) {
        kafkaError = error;
    }
} else {
    kafkaError = new Error(`Missing Kafka configuration: ${missingConfig.join(", ")}`);
}

function unavailableKafkaClient() {
    const unavailable = async () => {
        throw new Error(`Kafka is unavailable: ${kafkaError.message}`);
    };
    return {
        connect: unavailable,
        send: unavailable,
        subscribe: unavailable,
        run: unavailable,
        disconnect: async () => {},
    };
}

const producer = kafka ? kafka.producer() : unavailableKafkaClient();
const consumer = kafka
    ? kafka.consumer({ groupId: "quadrants26-order-consumer" })
    : unavailableKafkaClient();

module.exports = {
    kafka,
    producer,
    consumer,
    kafkaError,
};
