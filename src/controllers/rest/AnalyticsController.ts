import * as AnalyticsService from "$services/Analytics/AnalyticsService"
import { response_success } from "$utils/response.utils"
import { Context } from "hono"

export const getAnalytics = async (c: Context) => {
	const user = c.get("user")
	const tenantId =
		c.req.header("x-tenant-id") || user?.tenantUser?.[0]?.tenantId
	const range = c.req.query("range") || "24h"

	const result = await AnalyticsService.getAnalytics(
		tenantId,
		range as "24h" | "7d" | "30d" | "all",
	)

	return response_success(c, result, "Successfully retrieved analytics data")
}
