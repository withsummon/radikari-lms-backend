import { prisma } from "$pkg/prisma"
import { DateTime } from "luxon"

type TimeRange = "24h" | "7d" | "30d" | "all"

interface AnalyticsSummary {
	automatedTasks: number
	connectedIntegrations: number
	generatedArtifacts: number
	aiTokensUsed: number
	promptTokens: number
	completionTokens: number
}

interface TokenMetric {
	date: string
	tokens: number
	promptTokens?: number
	completionTokens?: number
}

interface TenantTokenMetric {
	tenantId: string
	name: string
	totalTokens: number
	tokenLimit: number | null
	usagePercentage: number
}

interface TenantDistribution {
	name: string
	value: number
	fill?: string
}

interface DashboardData {
	summary: AnalyticsSummary
	tokenConsumption: TokenMetric[]
	tenantUsage: TenantTokenMetric[]
	tenantDistribution: TenantDistribution[]
}

export const getAnalytics = async (
	tenantId: string,
	range: TimeRange,
): Promise<DashboardData> => {
	const now = DateTime.now()
	let startDate: DateTime | undefined

	switch (range) {
		case "24h":
			startDate = now.minus({ hours: 24 })
			break
		case "7d":
			startDate = now.minus({ days: 7 })
			break
		case "30d":
			startDate = now.minus({ days: 30 })
			break
		case "all":
			// No start date filter for "all"
			break
		default:
			startDate = now.minus({ hours: 24 })
	}

	const dateFilter = startDate
		? {
				createdAt: {
					gte: startDate.toJSDate(),
				},
			}
		: {}

	const filteredMessages = await prisma.aiChatRoomMessage.findMany({
		where: {
			...dateFilter,
			totalTokens: {
				not: null,
			},
		},
		select: {
			createdAt: true,
			totalTokens: true,
			promptTokens: true,
			completionTokens: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	})

	const roomAggregates = await prisma.aiChatRoomMessage.groupBy({
		by: ["aiChatRoomId"],
		where: {
			totalTokens: { not: null },
		},
		_sum: {
			totalTokens: true,
			promptTokens: true,
			completionTokens: true,
		},
	})
	const roomIds = roomAggregates.map((r) => r.aiChatRoomId)

	const rooms = await prisma.aiChatRoom.findMany({
		where: {
			id: { in: roomIds },
		},
		select: {
			id: true,
			tenant: {
				select: {
					id: true,
					name: true,
					tokenLimit: true,
				},
			},
		},
	})

	const roomTenantMap = new Map<string, (typeof rooms)[0]["tenant"]>()
	for (const r of rooms) {
		if (r.tenant) {
			roomTenantMap.set(r.id, r.tenant)
		}
	}

	const tokenConsumption: TokenMetric[] = []
	const groupedData: Record<
		string,
		{ total: number; prompt: number; completion: number }
	> = {}

	const getFormat = (date: DateTime) => {
		if (range === "24h") return date.toFormat("HH:mm")
		if (range === "7d") return date.toFormat("EEE") // Day name (Mon, Tue)
		if (range === "30d") return date.toFormat("dd MMM")
		return date.toFormat("MMM yyyy")
	}

	for (const msg of filteredMessages) {
		const dt = DateTime.fromJSDate(msg.createdAt)
		const key = getFormat(dt)

		if (!groupedData[key]) {
			groupedData[key] = { total: 0, prompt: 0, completion: 0 }
		}

		groupedData[key].total += msg.totalTokens || 0
		groupedData[key].prompt += msg.promptTokens || 0
		groupedData[key].completion += msg.completionTokens || 0
	}

	for (const [date, metrics] of Object.entries(groupedData)) {
		tokenConsumption.push({
			date,
			tokens: metrics.total,
			promptTokens: metrics.prompt,
			completionTokens: metrics.completion,
		})
	}

	const tenantUsageMap = new Map<
		string,
		{
			tenantId: string
			name: string
			totalTokens: number
			tokenLimit: number | null
			usagePercentage: number
		}
	>()

	let allTimeTotalTokens = 0
	let allTimePromptTokens = 0
	let allTimeCompletionTokens = 0

	for (const agg of roomAggregates) {
		const tenant = roomTenantMap.get(agg.aiChatRoomId)
		if (!tenant) continue

		const total = agg._sum.totalTokens || 0
		const prompt = agg._sum.promptTokens || 0
		const completion = agg._sum.completionTokens || 0

		allTimeTotalTokens += total
		allTimePromptTokens += prompt
		allTimeCompletionTokens += completion

		if (!tenantUsageMap.has(tenant.id)) {
			tenantUsageMap.set(tenant.id, {
				tenantId: tenant.id,
				name: tenant.name,
				totalTokens: 0,
				tokenLimit: tenant.tokenLimit,
				usagePercentage: 0,
			})
		}

		const metric = tenantUsageMap.get(tenant.id)!
		metric.totalTokens += total
	}

	const tenantUsage = [...tenantUsageMap.values()]
		.map((t) => ({
			...t,
			usagePercentage: t.tokenLimit
				? Math.round((t.totalTokens / t.tokenLimit) * 100)
				: 0,
		}))
		.sort((a, b) => b.totalTokens - a.totalTokens)

	const tenantDistribution = tenantUsage.map((t, index) => {
		const hue = 215 // Blue
		const saturation = 80
		const lightness = 50 + ((index * 5) % 40)

		return {
			name: t.name,
			value: t.totalTokens,
			fill: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
		}
	})

	const automatedTasksCount = await prisma.broadcast.count({
		where: {
			tenantId,
			...dateFilter,
		},
	})
	// NOTE: automatedTasks/Artifacts are still filtered by date?
	// Keeping them filtered as they are "Activity" metrics. Token Usage is "Quota" metric.

	const generatedArtifactsCount = await prisma.aiChatRoomMessage.count({
		where: {
			aiChatRoom: {
				tenantId,
			},
			sender: "ASSISTANT",
			...dateFilter,
		},
	})

	const connectedIntegrationsCount = 0

	return {
		summary: {
			automatedTasks: automatedTasksCount,
			connectedIntegrations: connectedIntegrationsCount,
			generatedArtifacts: generatedArtifactsCount,
			aiTokensUsed: allTimeTotalTokens,
			promptTokens: allTimePromptTokens,
			completionTokens: allTimeCompletionTokens,
		},
		tokenConsumption,
		tenantUsage,
		tenantDistribution,
	}
}
