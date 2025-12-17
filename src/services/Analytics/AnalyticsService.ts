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
	totalCostIDR: number
	highestUsageTenant: { name: string; tokens: number } | null
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

	// 1. Fetch Token Usage from AiUsageLog (Single Source of Truth)
	const usageLogs = await prisma.aiUsageLog.findMany({
		where: {
			...dateFilter,
		},
		select: {
			createdAt: true,
			totalTokens: true,
			promptTokens: true,
			completionTokens: true,
			tenantId: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	})

	// Get Tenant Details
	const usageLogTenantIds = [...new Set(usageLogs.map((l) => l.tenantId))]
	const logTenants = await prisma.tenant.findMany({
		where: { id: { in: usageLogTenantIds } },
		select: { id: true, name: true, tokenLimit: true },
	})
	const logTenantMap = new Map<string, (typeof logTenants)[0]>()
	for (const t of logTenants) {
		logTenantMap.set(t.id, t)
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

	// Aggregate Metrics
	let allTimeTotalTokens = 0
	let allTimePromptTokens = 0
	let allTimeCompletionTokens = 0

	// Aggregate Usage Logs
	for (const log of usageLogs) {
		const dt = DateTime.fromJSDate(log.createdAt)
		const key = getFormat(dt)

		if (!groupedData[key]) {
			groupedData[key] = { total: 0, prompt: 0, completion: 0 }
		}

		groupedData[key].total += log.totalTokens
		groupedData[key].prompt += log.promptTokens
		groupedData[key].completion += log.completionTokens

		allTimeTotalTokens += log.totalTokens
		allTimePromptTokens += log.promptTokens
		allTimeCompletionTokens += log.completionTokens
	}

	for (const [date, metrics] of Object.entries(groupedData)) {
		tokenConsumption.push({
			date,
			tokens: metrics.total,
			promptTokens: metrics.prompt,
			completionTokens: metrics.completion,
		})
	}

	// Aggregate Tenant Usage
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

	// Process Usage Logs for Tenants
	for (const log of usageLogs) {
		const tenant = logTenantMap.get(log.tenantId)
		const tenantName = tenant?.name || "Unknown Tenant"
		const tokenLimit = tenant?.tokenLimit || 0

		if (!tenantUsageMap.has(log.tenantId)) {
			tenantUsageMap.set(log.tenantId, {
				tenantId: log.tenantId,
				name: tenantName,
				totalTokens: 0,
				tokenLimit: tokenLimit,
				usagePercentage: 0,
			})
		}
		const metric = tenantUsageMap.get(log.tenantId)!
		metric.totalTokens += log.totalTokens
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

	const generatedArtifactsCount = await prisma.aiChatRoomMessage.count({
		where: {
			aiChatRoom: {
				tenantId,
			},
			sender: "ASSISTANT",
			...dateFilter,
		},
	})

	// Pricing Calculation (GPT-4.1-mini)
	// Input: $0.40 / 1M tokens
	// Output: $1.60 / 1M tokens
	// 1 USD = 16,000 IDR
	const USD_TO_IDR = 16000
	const INPUT_COST_PER_M = 0.4
	const OUTPUT_COST_PER_M = 1.6

	const totalInputCostUSD = (allTimePromptTokens / 1_000_000) * INPUT_COST_PER_M
	const totalOutputCostUSD =
		(allTimeCompletionTokens / 1_000_000) * OUTPUT_COST_PER_M
	const totalCostUSD = totalInputCostUSD + totalOutputCostUSD
	const totalCostIDR = totalCostUSD * USD_TO_IDR

	const highestUsageTenant =
		tenantUsage.length > 0
			? {
					name: tenantUsage[0].name,
					tokens: tenantUsage[0].totalTokens,
				}
			: null

	const connectedIntegrationsCount = 0

	return {
		summary: {
			automatedTasks: automatedTasksCount,
			connectedIntegrations: connectedIntegrationsCount,
			generatedArtifacts: generatedArtifactsCount,
			aiTokensUsed: allTimeTotalTokens,
			promptTokens: allTimePromptTokens,
			completionTokens: allTimeCompletionTokens,
			totalCostIDR: totalCostIDR,
			highestUsageTenant: highestUsageTenant,
		},
		tokenConsumption,
		tenantUsage,
		tenantDistribution,
	}
}
