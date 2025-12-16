import { Notification, NotificationType } from "../../generated/prisma/client"
import {
	CreateManyNotificationDTO,
	CreateNotificationDTO,
} from "$entities/Notification"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as NotificationRepository from "$repositories/NotificationRepository"
import * as TenantUserRepository from "$repositories/TenantUserRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
	data: CreateNotificationDTO,
): Promise<ServiceResponse<Notification | {}>> {
	try {
		const createdData = await NotificationRepository.create(data)
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`NotificationService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function createMany(
	data: CreateManyNotificationDTO,
): Promise<ServiceResponse<{}>> {
	try {
		await NotificationRepository.createMany(data)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.createMany : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function notifyTenantUsers(
	tenantId: string,
	type: NotificationType,
	title: string,
	message: string,
	referenceId?: string,
	excludeUserId?: string,
): Promise<ServiceResponse<{}>> {
	try {
		const tenantUsers = await TenantUserRepository.getByTenantId(tenantId)

		let userIds = tenantUsers.map((tu) => tu.userId)

		// Exclude specific user (e.g., the one who approved the knowledge)
		if (excludeUserId) {
			userIds = userIds.filter((id) => id !== excludeUserId)
		}

		if (userIds.length === 0) {
			return HandleServiceResponseSuccess({})
		}

		await NotificationRepository.createMany({
			userIds,
			tenantId,
			type,
			title,
			message,
			referenceId,
		})

		Logger.info(
			`NotificationService.notifyTenantUsers: Sent ${userIds.length} notifications`,
			{
				tenantId,
				type,
				referenceId,
			},
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.notifyTenantUsers : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function notifyTenantRoleUsers(
	tenantId: string,
	tenantRoleId: string,
	type: NotificationType,
	title: string,
	message: string,
	referenceId?: string,
): Promise<ServiceResponse<{}>> {
	try {
		const tenantRoleUsers =
			await TenantUserRepository.getByTenantRoleId(tenantRoleId)

		if (tenantRoleUsers.length === 0) {
			return HandleServiceResponseCustomError(
				"No users found",
				ResponseStatus.NOT_FOUND,
			)
		}

		let userIds = tenantRoleUsers.map((tur) => tur.userId)

		await NotificationRepository.createMany({
			userIds,
			tenantId,
			type,
			title,
			message,
			referenceId,
		})

		Logger.info(
			`NotificationService.notifyTenantRoleUsers: Sent ${userIds.length} notifications`,
			{
				tenantId,
				type,
				referenceId,
			},
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.notifyTenantRoleUsers : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function notifySpecificUsers(
	userIds: string[],
	tenantId: string | undefined,
	type: NotificationType,
	title: string,
	message: string,
	referenceId?: string,
): Promise<ServiceResponse<{}>> {
	try {
		if (userIds.length === 0) {
			return HandleServiceResponseSuccess({})
		}

		await NotificationRepository.createMany({
			userIds,
			tenantId,
			type,
			title,
			message,
			referenceId,
		})

		Logger.info(
			`NotificationService.notifySpecificUsers: Sent ${userIds.length} notifications`,
			{
				type,
				referenceId,
			},
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.notifySpecificUsers : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getByUserId(
	userId: string,
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Notification[]> | {}>> {
	try {
		const data = await NotificationRepository.getByUserId(userId, filters)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`NotificationService.getByUserId`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getUnreadCount(
	userId: string,
): Promise<ServiceResponse<{ count: number } | {}>> {
	try {
		const count = await NotificationRepository.getUnreadCount(userId)
		return HandleServiceResponseSuccess({ count })
	} catch (err) {
		Logger.error(`NotificationService.getUnreadCount`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function markAsRead(
	id: string,
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const notification = await NotificationRepository.getById(id)

		if (!notification) {
			return HandleServiceResponseCustomError(
				"Notification not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (notification.userId !== userId) {
			return HandleServiceResponseCustomError(
				"Unauthorized",
				ResponseStatus.UNAUTHORIZED,
			)
		}

		await NotificationRepository.markAsRead(id, userId)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.markAsRead`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function markAllAsRead(
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		await NotificationRepository.markAllAsRead(userId)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.markAllAsRead`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(
	id: string,
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const notification = await NotificationRepository.getById(id)

		if (!notification) {
			return HandleServiceResponseCustomError(
				"Notification not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (notification.userId !== userId) {
			return HandleServiceResponseCustomError(
				"Unauthorized",
				ResponseStatus.UNAUTHORIZED,
			)
		}

		await NotificationRepository.deleteById(id, userId)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`NotificationService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}
