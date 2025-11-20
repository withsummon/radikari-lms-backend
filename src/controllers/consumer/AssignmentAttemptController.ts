import * as AssignmentAttemptService from "$services/AssignmentAttemptService"
import Logger from "$pkg/logger"

export async function calculateAssignmentScore(rawMessage: string): Promise<void> {
    try {
        Logger.info(`AssignmentAttemptController.calculateAssignmentScore`, {
            message: `Calculating assignment score for assignment user attempt ${rawMessage}`,
        })

        const { assignmentUserAttemptId } = JSON.parse(rawMessage)
        await AssignmentAttemptService.calculateAssignmentScore(assignmentUserAttemptId)

        Logger.info(`AssignmentAttemptController.calculateAssignmentScore`, {
            message: `Assignment score calculated successfully for assignment user attempt ${assignmentUserAttemptId}`,
        })
    } catch (error) {
        Logger.error(`AssignmentAttemptController.calculateAssignmentScore`, {
            error: error,
        })
    }
}
