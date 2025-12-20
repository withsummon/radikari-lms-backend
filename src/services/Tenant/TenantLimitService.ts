import { prisma } from "$pkg/prisma"
import { DateTime } from "luxon"
import * as NotificationService from "$services/NotificationService"
import { NotificationType } from "../../../generated/prisma/client"

interface TokenLimitStatus {
	allowed: boolean
	usage: number
	limit: number
	usagePercent: number
	errorMessage?: string
}

export const checkTokenLimit = async (
	tenantId: string,
): Promise<TokenLimitStatus> => {
	const tenant = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: { tokenLimit: true, name: true },
	})

	if (!tenant || !tenant.tokenLimit || tenant.tokenLimit <= 0) {
		return { allowed: true, usage: 0, limit: 0, usagePercent: 0 }
	}

	const now = DateTime.now()
	const startOfMonth = now.startOf("month").toJSDate()
	const endOfMonth = now.endOf("month").toJSDate()

	const result = await prisma.aiUsageLog.aggregate({
		_sum: {
			totalTokens: true,
		},
		where: {
			tenantId,
			createdAt: {
				gte: startOfMonth,
				lte: endOfMonth,
			},
		},
	})

	const usage = result._sum.totalTokens || 0
	const limit = tenant.tokenLimit
	const usagePercent = (usage / limit) * 100

	// Check for critical (100%)
	if (usage >= limit) {
		await sendLimitReachedNotificationIfNeeded(
			tenantId,
			tenant.name,
			usage,
			limit,
		)
		return {
			allowed: false,
			usage,
			limit,
			usagePercent,
			errorMessage: `Token usage limit of ${limit} reached for this month. Please contact admin.`,
		}
	}

	// Check for warning (e.g. at 80%)
	if (usagePercent >= 80) {
		await sendLimitWarningIfNeeded(tenantId, tenant.name, usage, limit)
	}

	return { allowed: true, usage, limit, usagePercent }
}

async function sendLimitWarningIfNeeded(
	tenantId: string,
	tenantName: string,
	usage: number,
	limit: number,
) {
	const alreadyNotified = await prisma.notification.findFirst({
		where: {
			tenantId,
			title: "Peringatan Batas Token",
			createdAt: {
				gte: DateTime.now().minus({ days: 1 }).toJSDate(), // Max 1 warning per 24h
			},
		},
	})

	if (!alreadyNotified) {
		await NotificationService.notifyTenantUsers(
			tenantId,
			NotificationType.SYSTEM,
			"Peringatan Batas Token",
			`Penggunaan token tenant ${tenantName} telah mencapai ${Math.floor(
				(usage / limit) * 100,
			)}% dari batas bulanan.`,
		)
	}
}

async function sendLimitReachedNotificationIfNeeded(
	tenantId: string,
	tenantName: string,
	usage: number,
	limit: number,
) {
	const alreadyNotified = await prisma.notification.findFirst({
		where: {
			tenantId,
			title: "Batas Token Terlampaui",
			createdAt: {
				gte: DateTime.now().minus({ days: 1 }).toJSDate(),
			},
		},
	})

	if (!alreadyNotified) {
		await NotificationService.notifyTenantUsers(
			tenantId,
			NotificationType.SYSTEM,
			"Batas Token Terlampaui",
			`Tenant ${tenantName} telah mencapai batas penggunaan token bulanan (${limit}). Layanan AI dihentikan sementara.`,
		)
	}
}
