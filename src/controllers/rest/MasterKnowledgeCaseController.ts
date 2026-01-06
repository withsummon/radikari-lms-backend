import { Context, TypedResponse } from "hono"
import * as MasterKnowledgeCaseService from "$services/MasterKnowledgeCaseService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"
import * as EzFilter from "@nodewave/prisma-ezfilter"

export async function create(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId") // ✅ Ambil Tenant ID dari URL
	const data: MasterKnowledgeCaseDTO = await c.req.json()

	// Pass tenantId ke service
	const serviceResponse = await MasterKnowledgeCaseService.create(
		tenantId,
		data,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new MasterKnowledgeCase!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId") // ✅ Ambil Tenant ID
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)

	// Pass tenantId ke service
	const serviceResponse = await MasterKnowledgeCaseService.getAll(
		tenantId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all MasterKnowledgeCase!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const serviceResponse = await MasterKnowledgeCaseService.getById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched MasterKnowledgeCase by id!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: MasterKnowledgeCaseDTO = await c.req.json()
	const id = c.req.param("id")

	const serviceResponse = await MasterKnowledgeCaseService.update(id, data)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated MasterKnowledgeCase!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const serviceResponse = await MasterKnowledgeCaseService.deleteById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted MasterKnowledgeCase!",
	)
}
