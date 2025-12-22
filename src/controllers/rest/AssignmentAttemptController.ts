import { UserJWTDAO } from "$entities/User"
import { Context, TypedResponse } from "hono"
import * as AssignmentAttemptService from "$services/AssignmentAttemptService"
import {
	handleServiceErrorWithResponse,
	response_created,
	response_success,
} from "$utils/response.utils"
import { AssignmentUserAttemptAnswerDTO } from "$entities/Assignment"

export async function create(c: Context): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")
	const tenantId = c.get("tenantId")

	const serviceResponse = await AssignmentAttemptService.create(
		assignmentId,
		user.id,
		tenantId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new Assignment Attempt!",
	)
}

export async function getCurrentUserAssignmentAttempt(
	c: Context,
): Promise<TypedResponse> {
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse =
		await AssignmentAttemptService.getCurrentUserAssignmentAttemptByUserId(
			user.id,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched current user assignment attempt!",
	)
}

export async function getAllQuestionsAndAnswers(
	c: Context,
): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse =
		await AssignmentAttemptService.getAllQuestionsAndAnswers(
			user.id,
			assignmentId,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched all questions and answers!",
	)
}

export async function updateAnswer(c: Context): Promise<TypedResponse> {
	const data: AssignmentUserAttemptAnswerDTO = await c.req.json()
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentAttemptService.updateAnswer(
		user.id,
		assignmentId,
		data,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated answer!",
	)
}

export async function submitAssignment(c: Context): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentAttemptService.submitAssignment(
		user.id,
		assignmentId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully submitted assignment!",
	)
}

export async function getHistoryUserAssignmentAttempts(
	c: Context,
): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse =
		await AssignmentAttemptService.getHistoryUserAssignmentAttempts(
			user.id,
			assignmentId,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched history user assignment attempts!",
	)
}

export async function getMemberAssignmentAttemptHistory(
	c: Context,
): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const userId = c.req.param("userId")

	const serviceResponse =
		await AssignmentAttemptService.getHistoryUserAssignmentAttempts(
			userId,
			assignmentId,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched member assignment attempt history!",
	)
}

export async function getTimeStatus(c: Context): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const user: UserJWTDAO = c.get("jwtPayload")

	const serviceResponse = await AssignmentAttemptService.getTimeStatus(
		user.id,
		assignmentId,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched time status",
	)
}

export async function getAssignmentExportData(
	c: Context,
): Promise<TypedResponse> {
	const assignmentId = c.req.param("assignmentId")
	const tenantId = c.get("tenantId")

	const serviceResponse =
		await AssignmentAttemptService.getAssignmentExportData(
			tenantId,
			assignmentId,
		)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched assignment export data!",
	)
}
