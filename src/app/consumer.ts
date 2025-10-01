import { RabbitMQConnection } from "$pkg/pubsub";

export async function startConsumerApp() {
    const commonChannel = new RabbitMQConnection()
    await commonChannel.connect()
    await commonChannel.setPrefetchCount(1)

    // Consume Messages Here

    // For each use case , will need different channel to consume event separately
}
