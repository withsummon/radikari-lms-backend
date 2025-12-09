import Logger from "$pkg/logger"
import * as KnowledgeService from "$services/KnowledgeService"
import * as AssignmentService from "$services/AssignmentService"

export async function sendKnowledgeApprovalNotification(message: any) {
    try {
        const { knowledgeId, excludeUserId } = JSON.parse(message)
        await KnowledgeService.sendKnowledgeApprovalNotification(knowledgeId, excludeUserId)
    } catch (error) {
        Logger.error(`NotificationController.sendKnowledgeApprovalNotification`, {
            error: error,
        })
    }
}

export async function sendAssignmentAssignedNotification(message: any) {
    try {
        const { assignmentId, tenantId } = JSON.parse(message)
        await AssignmentService.sendAssignmentAssignedNotification(assignmentId, tenantId)
    } catch (error) {
        Logger.error(`NotificationController.sendAssignmentAssignedNotification`, {
            error: error,
        })
    }
}
