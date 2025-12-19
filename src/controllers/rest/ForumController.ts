import { Context, TypedResponse } from "hono"
import * as ForumService from "$services/ForumService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { ForumCommentDTO, ForumDTO } from "$entities/Forum"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function create(c: Context): Promise<TypedResponse> {
	const data: ForumDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await ForumService.create(data, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new Forum!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.getAll(filters, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all Forum!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.getById(id, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Forum by id!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: ForumDTO = await c.req.json()
	const id = c.req.param("id")
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await ForumService.update(id, data, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated Forum!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await ForumService.deleteById(id, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted Forum!",
	)
}

export async function likeForum(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.likeForum(id, tenantId, user.id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(c, serviceResponse.data, "Successfully liked Forum!")
}

export async function commentForum(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const data: ForumCommentDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await ForumService.commentForum(
		id,
		data,
		user.id,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully commented Forum!",
	)
}

export async function getForumComments(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.getForumComments(
		id,
		filters,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Forum comments!",
	)
}

export async function getForumCommentReplies(
	c: Context,
): Promise<TypedResponse> {
	const commentId = c.req.param("commentId")
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)

	const serviceResponse = await ForumService.getForumCommentReplies(
		commentId,
		filters,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Forum comment replies!",
	)
}

// UPDATE: Menangkap ID Forum agar sesuai dengan logika Service baru
export async function deleteForumComment(c: Context): Promise<TypedResponse> {
	const commentId = c.req.param("commentId")
	const forumId = c.req.param("id") // Ambil ID Forum
	const tenantId = c.req.param("tenantId") // Ambil ID Tenant
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.deleteForumComment(
		tenantId,
		forumId,
		commentId,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted Forum comment!",
	)
}

export async function likeOrUnlikeForumComment(
	c: Context,
): Promise<TypedResponse> {
	const commentId = c.req.param("commentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await ForumService.likeOrUnlikeForumComment(
		commentId,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully liked or unliked Forum comment!",
	)
}

export async function pinOrUnpinForum(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await ForumService.pinOrUnpinForum(
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
		"Successfully pinned or unpinned Forum!",
	)
}
