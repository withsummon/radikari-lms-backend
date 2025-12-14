import { Context, TypedResponse } from "hono"
import * as AiPromptService from "$services/AiPromptService"
import {
	handleServiceErrorWithResponse,
	response_success,
} from "$utils/response.utils"
import { AiPromptDTO } from "$entities/AiPrompt"
import { UserJWTDAO } from "$entities/User"

export async function getByTenantId(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AiPromptService.getByTenantId(tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched AiPrompt by id!",
	)
}

export async function createOrUpdateByTenantId(
	c: Context,
): Promise<TypedResponse> {
	const data: AiPromptDTO = await c.req.json()
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AiPromptService.upsertByTenantId(
		tenantId,
		data,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated AiPrompt!",
	)
}
