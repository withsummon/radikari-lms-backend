import {
	CreateManyNotificationDTO,
	CreateNotificationDTO,
} from "$entities/Notification"
import { prisma } from "$pkg/prisma"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { ulid } from "ulid"

export async function create(data: CreateNotificationDTO) {
	return await prisma.notification.create({
		data: {
			id: ulid(),
			userId: data.userId,
			tenantId: data.tenantId,
			type: data.type,
			title: data.title,
			message: data.message,
			referenceId: data.referenceId,
		},
	})
}

export async function createMany(data: CreateManyNotificationDTO) {
	const notifications = data.userIds.map((userId) => ({
		id: ulid(),
		userId,
		tenantId: data.tenantId,
		type: data.type,
		title: data.title,
		message: data.message,
		referenceId: data.referenceId,
	}))

	return await prisma.notification.createMany({
		data: notifications,
	})
}

export async function getByUserId(
	userId: string,
	filters: EzFilter.FilteringQuery,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const whereClause = {
		...usedFilters.query.where,
		userId,
	}

	const [notifications, totalData] = await Promise.all([
		prisma.notification.findMany({
			...usedFilters.query,
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
		}),
		prisma.notification.count({
			where: whereClause,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take) {
		totalPage = Math.ceil(totalData / usedFilters.query.take)
	}

	return {
		entries: notifications,
		totalData,
		totalPage,
	}
}

export async function getUnreadCount(userId: string) {
	return await prisma.notification.count({
		where: {
			userId,
			isRead: false,
		},
	})
}

export async function markAsRead(id: string, userId: string) {
	return await prisma.notification.updateMany({
		where: {
			id,
			userId,
		},
		data: {
			isRead: true,
		},
	})
}

export async function markAllAsRead(userId: string) {
	return await prisma.notification.updateMany({
		where: {
			userId,
			isRead: false,
		},
		data: {
			isRead: true,
		},
	})
}

export async function deleteById(id: string, userId: string) {
	return await prisma.notification.deleteMany({
		where: {
			id,
			userId,
		},
	})
}

export async function getById(id: string) {
	return await prisma.notification.findUnique({
		where: {
			id,
		},
	})
}
