import { Context, TypedResponse } from "hono"
import * as BroadcastService from "$services/BroadcastService"
import {
	handleServiceErrorWithResponse,
	response_success,
} from "$utils/response.utils"
import { BroadcastDTO } from "$entities/Broadcast"
import { UserJWTDAO } from "$entities/User"

export async function getByTenantId(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await BroadcastService.getByTenantId(tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Broadcast by tenant!",
	)
}

export async function createOrUpdateByTenantId(
	c: Context,
): Promise<TypedResponse> {
	const data: BroadcastDTO = await c.req.json()
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await BroadcastService.upsertByTenantId(
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
		"Successfully updated Broadcast!",
	)
}
