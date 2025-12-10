import { Context, TypedResponse } from "hono"
import * as AssignmentService from "$services/AssignmentService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { AssignmentCreateDTO } from "$entities/Assignment"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function create(c: Context): Promise<TypedResponse> {
	const data: AssignmentCreateDTO = await c.req.json()
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentService.create(
		data,
		tenantId,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new Assignment!",
	)
}

export async function getAll(c: Context): Promise<TypedResponse> {
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getAll(
		filters,
		user,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all Assignment!",
	)
}

export async function getById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getById(id, tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Assignment by id!",
	)
}

export async function update(c: Context): Promise<TypedResponse> {
	const data: AssignmentCreateDTO = await c.req.json()
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentService.update(
		id,
		data,
		tenantId,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated Assignment!",
	)
}

export async function deleteById(c: Context): Promise<TypedResponse> {
	const id = c.req.param("id")
	const tenantId = c.req.param("tenantId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentService.deleteById(
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
		"Successfully deleted Assignment!",
	)
}

export async function getSummaryByUserIdAndTenantId(
	c: Context,
): Promise<TypedResponse> {
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getSummaryByUserIdAndTenantId(
		user.id,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched summary by user id and tenant id!",
	)
}

export async function getSummaryByTenantId(c: Context): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getSummaryByTenantId(tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched summary by tenant id!",
	)
}

export async function getUserListWithAssignmentSummaryByTenantId(
	c: Context,
): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId")

	const serviceResponse =
		await AssignmentService.getUserListWithAssignmentSummaryByTenantId(tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched user list with assignment summary by tenant id!",
	)
}

export async function getAssginmentWithUserSummaryByTenantId(
	c: Context,
): Promise<TypedResponse> {
	const tenantId = c.req.param("tenantId")

	const serviceResponse =
		await AssignmentService.getAssginmentWithUserSummaryByTenantId(tenantId)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched assignment with user summary by tenant id!",
	)
}

export async function getUserAssignmentList(
	c: Context,
): Promise<TypedResponse> {
	const userId = c.req.param("userId")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getUserAssignmentList(
		userId,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched user assignment list by user id and tenant id!",
	)
}

export async function getDetailUserAssignmentByUserIdAndAssignmentId(
	c: Context,
): Promise<TypedResponse> {
	const userId = c.req.param("userId")
	const assignmentId = c.req.param("assignmentId")

	const serviceResponse =
		await AssignmentService.getDetailUserAssignmentByUserIdAndTenantId(
			userId,
			assignmentId,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched detail user assignment by user id and assignment id!",
	)
}
export async function getStatistics(c: Context): Promise<TypedResponse> {
	const assignmentId = c.req.param("id")
	const tenantId = c.req.param("tenantId")

	const serviceResponse = await AssignmentService.getStatistics(
		assignmentId,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched assignment statistics!",
	)
}
