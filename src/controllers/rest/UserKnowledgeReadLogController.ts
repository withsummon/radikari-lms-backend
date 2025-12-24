import { Context } from "hono"
import * as UserKnowledgeReadLogService from "$services/UserKnowledgeReadLogService"
import {
	response_success,
	handleServiceErrorWithResponse,
} from "$utils/response.utils"

export async function getAll(c: Context) {
	const tenantId = c.req.param("id")
	const filters = c.req.query()

	const result = await UserKnowledgeReadLogService.getAllByTenant(
		tenantId,
		filters as any,
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
