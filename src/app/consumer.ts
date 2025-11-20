import { RabbitMQConnection } from "$pkg/pubsub"
import { PUBSUB_TOPICS } from "$entities/PubSub"
import * as AssignmentAttemptController from "$controllers/consumer/AssignmentAttemptController"
export async function startConsumerApp() {
    const commonChannel = new RabbitMQConnection()
    await commonChannel.connect()

    await commonChannel.consume(PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT, async (message) => {
        await AssignmentAttemptController.calculateAssignmentScore(message)
    })
}
