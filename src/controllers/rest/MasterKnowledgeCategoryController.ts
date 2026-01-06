import { Context, TypedResponse } from "hono"
import * as MasterKnowledgeCategoryService from "$services/MasterKnowledgeCategoryService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { MasterKnowledgeCategoryDTO } from "$entities/MasterKnowledgeCategory"
import * as EzFilter from "@nodewave/prisma-ezfilter"

export async function create(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId") // ✅ Ambil tenantId
	const data: MasterKnowledgeCategoryDTO = await c.req.json()

	// Pass tenantId ke service
	const serviceResponse = await MasterKnowledgeCategoryService.create(
		tenantId,
		data,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new MasterKnowledgeCategory!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId") // ✅ Ambil tenantId
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)

	// Pass tenantId ke service untuk filtering
	const serviceResponse = await MasterKnowledgeCategoryService.getAll(
		tenantId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all MasterKnowledgeCategory!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	// Note: Sebaiknya divalidasi juga apakah ID ini milik tenant tersebut (opsional di sini, aman di service)
	const serviceResponse = await MasterKnowledgeCategoryService.getById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched MasterKnowledgeCategory by id!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: MasterKnowledgeCategoryDTO = await c.req.json()
	const id = c.req.param("id")

	const serviceResponse = await MasterKnowledgeCategoryService.update(id, data)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated MasterKnowledgeCategory!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")

	const serviceResponse = await MasterKnowledgeCategoryService.deleteById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted MasterKnowledgeCategory!",
	)
}
