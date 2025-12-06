import server from "$server/instance"
import * as AssignmentAttemptController from "$controllers/cron/AssignmentAttemptController"

export async function startCronApp() {
	const cronServer = server.cronServer

	cronServer.addController(
		"Check Assignment Expired Date",
		"*/1 * * * *",
		() => {
			AssignmentAttemptController.checkAssignmentExpiredDate()
		},
	)

	// Example Usages :
	// cronServer.addController("Some Scheduled Task", "*/30 * * * * *", TaskController.someTask)
}
