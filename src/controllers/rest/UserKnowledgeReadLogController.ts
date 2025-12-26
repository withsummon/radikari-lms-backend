import { Context } from "hono"
import * as UserKnowledgeReadLogService from "$services/UserKnowledgeReadLogService"
import {
	response_success,
	handleServiceErrorWithResponse,
} from "$utils/response.utils"

// Helper sederhana untuk mengubah JSON String ("{...}") menjadi Object ({...})
const safeParse = (value: any) => {
	if (typeof value === "string") {
		try {
			return JSON.parse(value)
		} catch {
			return value // Kembalikan apa adanya jika bukan JSON valid
		}
	}
	return value
}

export async function getAll(c: Context) {
	const tenantId = c.req.param("id")
	const rawQuery = c.req.query()

	// FIX: Buat object baru yang sudah di-parse
	const queryParams = {
		...rawQuery,
		// Parse manual field-field yang dikirim sebagai JSON string oleh frontend
		filters: rawQuery.filters ? safeParse(rawQuery.filters) : undefined,
		searchFilters: rawQuery.searchFilters
			? safeParse(rawQuery.searchFilters)
			: undefined,
		rangedFilters: rawQuery.rangedFilters
			? safeParse(rawQuery.rangedFilters)
			: undefined,
	}

	const result = await UserKnowledgeReadLogService.getAllByTenant(
		tenantId,
		queryParams as any,
	)

	if (!result.status) return handleServiceErrorWithResponse(c, result)
	return response_success(
		c,
		result.data,
		"Successfully fetched knowledge read logs",
	)
}

export async function getStatus(c: Context) {
	const user = c.get("jwtPayload")
	const tenantId = c.req.param("id")
	const knowledgeId = c.req.param("knowledgeId")

	const result = await UserKnowledgeReadLogService.getStatusInTenant(
		tenantId,
		user.id,
		knowledgeId,
	)

	if (!result.status) return handleServiceErrorWithResponse(c, result)
	return response_success(c, result.data, "Successfully fetched read status")
}

export async function markViewed(c: Context) {
	const user = c.get("jwtPayload")
	const tenantId = c.req.param("id")
	const { knowledgeId } = await c.req.json()

	const result = await UserKnowledgeReadLogService.markViewedInTenant(
		tenantId,
		user.id,
		knowledgeId,
	)

	if (!result.status) return handleServiceErrorWithResponse(c, result)
	return response_success(c, result.data, "Knowledge marked as viewed")
}
