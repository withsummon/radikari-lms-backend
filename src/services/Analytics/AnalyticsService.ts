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

interface DashboardData {
	summary: AnalyticsSummary
	tokenConsumption: TokenMetric[]
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

	const messages = await prisma.aiChatRoomMessage.findMany({
		where: {
			aiChatRoom: {
				tenantId: tenantId,
			},
			...dateFilter,
			totalTokens: {
				not: null, // Only count messages with token usage
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

	const totalTokensUsed = messages.reduce(
		(sum, msg) => sum + (msg.totalTokens || 0),
		0,
	)
	const promptTokensUsed = messages.reduce(
		(sum, msg) => sum + (msg.promptTokens || 0),
		0,
	)
	const completionTokensUsed = messages.reduce(
		(sum, msg) => sum + (msg.completionTokens || 0),
		0,
	)

	// 3. Group for Chart Data
	const tokenConsumption: TokenMetric[] = []
	const groupedData: Record<
		string,
		{ total: number; prompt: number; completion: number }
	> = {}

	// Helper to format date key based on range
	const getFormat = (date: DateTime) => {
		if (range === "24h") return date.toFormat("HH:mm")
		if (range === "7d") return date.toFormat("EEE") // Day name (Mon, Tue)
		if (range === "30d") return date.toFormat("dd MMM")
		return date.toFormat("MMM yyyy")
	}

	for (const msg of messages) {
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

	const automatedTasksCount = await prisma.broadcast.count({
		where: {
			tenantId,
			...dateFilter,
		},
	})

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
			aiTokensUsed: totalTokensUsed,
			promptTokens: promptTokensUsed,
			completionTokens: completionTokensUsed,
		},
		tokenConsumption,
	}
}
