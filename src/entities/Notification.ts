import { NotificationType } from "../../generated/prisma/client"

export interface NotificationDTO {
	id: string
	userId: string
	tenantId?: string
	type: NotificationType
	title: string
	message: string
	referenceId?: string
	isRead?: boolean
}

export interface CreateNotificationDTO {
	userId: string
	tenantId?: string
	type: NotificationType
	title: string
	message: string
	referenceId?: string
}

export interface CreateManyNotificationDTO {
	userIds: string[]
	tenantId?: string
	type: NotificationType
	title: string
	message: string
	referenceId?: string
}
