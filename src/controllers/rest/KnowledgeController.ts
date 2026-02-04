import { Context, TypedResponse } from "hono"
import * as KnowledgeService from "$services/KnowledgeService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
	response_bad_request, // ✅ Pastikan ini diimport
} from "$utils/response.utils"
import {
	KnowledgeApprovalDTO,
	KnowledgeBulkCreateDTO,
	KnowledgeDTO,
} from "$entities/Knowledge"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"
import { KnowledgeType } from "../../../generated/prisma/client"
import { KnowledgeShareDTO } from "$entities/Knowledge"
import { attachOverdueToKnowledgeList } from "$utils/knowledgeOverdue.utils"
import Logger from "$pkg/logger"

export async function create(c: Context): Promise<TypedResponse> {
	const data: KnowledgeDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	// 🧹 Console log dihapus untuk production

	const serviceResponse = await KnowledgeService.create(user.id, tenantId, data)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new Knowledge!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.getAll(user, tenantId, filters)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	// ✅ Tambahkan warning flag overdue > 24 jam untuk yang PENDING
	const dataWithOverdue = attachOverdueToKnowledgeList(serviceResponse.data, 24)

	return response_success(
		c,
		dataWithOverdue,
		"Successfully fetched all Knowledge!",
	)
}

export async function getAllArchived(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.getAllArchived(
		user,
		tenantId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	const dataWithOverdue = attachOverdueToKnowledgeList(serviceResponse.data, 24)

	return response_success(
		c,
		dataWithOverdue,
		"Successfully fetched all Archived Knowledge!",
	)
}

export async function getSummary(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.getSummary(
		user,
		tenantId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Knowledge summary!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.getById(id, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Knowledge by id!",
	)
}

export async function getAllVersionsById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")

	const serviceResponse = await KnowledgeService.getAllVersionsById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all Knowledge versions!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: KnowledgeDTO = await c.req.json()
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.update(
		id,
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
		"Successfully updated Knowledge!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")
	const serviceResponse = await KnowledgeService.deleteById(
		id,
		tenantId,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted Knowledge!",
	)
}

export async function approveById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")
	const data: KnowledgeApprovalDTO = await c.req.json()

	const serviceResponse = await KnowledgeService.approveById(
		id,
		tenantId,
		user.id,
		data,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully approved Knowledge!",
	)
}

export async function bulkCreate(c: Context): Promise<TypedResponse> {
	const data: KnowledgeBulkCreateDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")

	Logger.info("bulkCreate called with data:", {
		type: data.type,
		access: data.access,
		fileUrl: data.fileUrl,
		KnowledgeTypeCASE: KnowledgeType.CASE,
		isTypeEqual: data.type === KnowledgeType.CASE,
	})

	let serviceResponse
	if (data.type === KnowledgeType.CASE) {
		Logger.info("Calling bulkCreateTypeCase service", {})
		serviceResponse = await KnowledgeService.bulkCreateTypeCase(data, user.id)
	} else {
		Logger.info("Calling bulkCreate service (for ARTICLE)", {})
		serviceResponse = await KnowledgeService.bulkCreate(data, user.id)
	}

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully bulk created Knowledge!",
	)
}

export async function bulkCreateTypeCase(c: Context): Promise<TypedResponse> {
	const data: KnowledgeBulkCreateDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.bulkCreateTypeCase(
		data,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully bulk created Knowledge!",
	)
}

export async function archiveOrUnarchiveKnowledge(
	c: Context,
): Promise<TypedResponse> {
	const id = c.req.param("id")
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await KnowledgeService.archiveOrUnarchiveKnowledge(
		id,
		user.id,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully archived or unarchived Knowledge!",
	)
}

export async function shareKnowledge(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")
	const data: KnowledgeShareDTO = await c.req.json()

	// ✅ FIX: Validasi mengembalikan Bad Request (400), bukan Created (201)
	if (!data.emails || data.emails.length === 0) {
		return response_bad_request(c, "Emails are required")
	}

	const serviceResponse = await KnowledgeService.shareKnowledge(
		user.id,
		tenantId,
		id,
		data,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully shared knowledge!",
	)
}

export async function getShareHistory(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await KnowledgeService.getShareHistory(
		user.id,
		tenantId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched share history!",
	)
}
