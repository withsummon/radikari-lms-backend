import Logger from "$pkg/logger"
import * as AssignmentAttemptService from "$services/AssignmentAttemptService"

export async function checkAssignmentExpiredDate() {
	try {
		await AssignmentAttemptService.getAssignmentsByExpiredDate()
	} catch (err) {
		Logger.error(`AssignmentAttemptController.checkAssignmentExpiredDate`, {
			error: err,
		})
	}
}
