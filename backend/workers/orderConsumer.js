
const { consumer } = require("../services/kafka");

const TOPIC = process.env.KAFKA_TOPIC || "orders.created";

// Start the order consumer
async function startOrderConsumer() {
    try {
        await consumer.connect();
        console.log("Order consumer connected to Kafka");

        await consumer.subscribe({
            topic: TOPIC,
            fromBeginning: false,
        });

        console.log(`Subscribed to topic: ${TOPIC}`);

        // Listen for incoming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    // Convert Kafka message into a JavaScript object
                    const event = JSON.parse(message.value.toString());

                    // Validate the event
                    if (
                        event.eventType !== "order.created" ||
                        !event.data ||
                        !event.data.orderId
                    ) {
                        throw new Error("Invalid order.created event");
                    }

                    const order = event.data;

                    console.log("New order event received!");
                    console.log("Event ID:", event.eventId);
                    console.log("Order ID:", order.orderId);
                    console.log("Customer:", order.customer.name);
                    console.log("Total (paise):", order.totalPaise);
                    console.log("Number of seller orders:", order.sellerOrders.length);

                } catch (error) {
                    console.error("Failed to process order event:", error.message);
                    throw error;
                }
            },
        });

    } catch (error) {
        console.error("Order consumer startup failed:", error);
        throw error;
    }
}

module.exports = { startOrderConsumer };
startOrderConsumer();
