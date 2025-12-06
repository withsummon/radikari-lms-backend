import { Context, TypedResponse } from "hono"
import * as AnnouncementService from "$services/AnnouncementService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { AnnouncementCreateDTO } from "$entities/Announcement"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function create(c: Context): Promise<TypedResponse> {
	const data: AnnouncementCreateDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AnnouncementService.create(
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
		"Successfully created new Announcement!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AnnouncementService.getAll(
		filters,
		user.id,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all Announcement!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")

	const serviceResponse = await AnnouncementService.getById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Announcement by id!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: AnnouncementCreateDTO = await c.req.json()
	const id = c.req.param("id")

	const serviceResponse = await AnnouncementService.update(id, data)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated Announcement!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")

	const serviceResponse = await AnnouncementService.deleteById(id)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully deleted Announcement!",
	)
}
