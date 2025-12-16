import { RabbitMQConnection } from "$pkg/pubsub"
import { PUBSUB_TOPICS } from "$entities/PubSub"
import * as AssignmentAttemptController from "$controllers/consumer/AssignmentAttemptController"
import * as NotificationController from "$controllers/consumer/NotificationController"

export async function startConsumerApp() {
	const commonChannel = new RabbitMQConnection()
	await commonChannel.connect()

	const notificationChannel = new RabbitMQConnection()
	await notificationChannel.connect()

	await commonChannel.consume(
		PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT,
		async (message) => {
			await AssignmentAttemptController.calculateAssignmentScore(message)
		},
	)

	await notificationChannel.consume(
		PUBSUB_TOPICS.KNOWLEDGE_APPROVAL_NOTIFICATION,
		async (message) => {
			await NotificationController.sendKnowledgeApprovalNotification(message)
		},
	)

	await notificationChannel.consume(
		PUBSUB_TOPICS.ASSIGNMENT_ASSIGNED_NOTIFICATION,
		async (message) => {
			await NotificationController.sendAssignmentAssignedNotification(message)
		},
	)
}
