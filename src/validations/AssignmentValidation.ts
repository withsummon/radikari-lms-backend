import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import {
	AssignmentCreateDTO,
	AssignmentUserAttemptAnswerDTO,
} from "$entities/Assignment"
import {
	AssignmentSchema,
	AssignmentTenantRoleAccessSchema,
	AssignmentQuestionSchema,
	AssignmentQuestionOptionSchema,
	AssignmentQuestionEssayReferenceAnswerSchema,
	AssignmentQuestionTrueFalseAnswerSchema,
	AssignmentUserAttemptAnswerSchema,
} from "./schema/AssignmentSchema"
import * as Helpers from "./helper"
import {
	AssignmentAccess,
	AssignmentQuestionType,
} from "../../generated/prisma/client"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"
import { prisma } from "$pkg/prisma"

export async function validateAssignmentSchema(c: Context, next: Next) {
	const data: AssignmentCreateDTO = await c.req.json()

	const { roleAccesses, userEmails, questions, ...rest } = data

	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		AssignmentSchema,
		rest,
	)

	switch (data.access) {
		case AssignmentAccess.TENANT_ROLE:
			invalidFields.push(
				...Helpers.validateSchema(
					AssignmentTenantRoleAccessSchema,
					roleAccesses,
				),
			)
			break
		case AssignmentAccess.USER:
			if (userEmails.length === 0) {
				invalidFields.push({
					field: "userEmails",
					message: "User emails are required",
				})
			}
			break
	}

	for (const question of questions) {
		const { options, trueFalseAnswer, essayReferenceAnswer, ...questionRest } =
			question

		invalidFields.push(
			...Helpers.validateSchema(AssignmentQuestionSchema, questionRest),
		)

		switch (question.type) {
			case AssignmentQuestionType.MULTIPLE_CHOICE:
				invalidFields.push(
					...Helpers.validateSchema(AssignmentQuestionOptionSchema, options),
				)
				break
			case AssignmentQuestionType.ESSAY:
				if (!question.essayReferenceAnswer) {
					invalidFields.push({
						field: "questions",
						message: "Essay reference answer is required",
					})
				} else {
					invalidFields.push(
						...Helpers.validateSchema(
							AssignmentQuestionEssayReferenceAnswerSchema,
							essayReferenceAnswer,
						),
					)
				}
				break
			case AssignmentQuestionType.TRUE_FALSE:
				if (!question.trueFalseAnswer) {
					invalidFields.push({
						field: "questions",
						message: "True false answer is required",
					})
				} else {
					invalidFields.push(
						...Helpers.validateSchema(
							AssignmentQuestionTrueFalseAnswerSchema,
							trueFalseAnswer,
						),
					)
				}
				break
			default:
				invalidFields.push({ field: "type", message: "Type is not valid" })
				break
		}
	}

	// Validate unique order
	const orderMap = new Map<number, number>()
	for (const question of questions) {
		if (orderMap.has(question.order)) {
			invalidFields.push({
				field: "questions",
				message: "Order must be unique",
			})
		}
		orderMap.set(question.order, question.order)
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	if (data.access == "TENANT_ROLE") {
		if (!roleAccesses || roleAccesses.length == 0) {
			invalidFields.push({
				field: "roleAccesses",
				message: "Tenant role is required",
			})
		} else {
			for (const tenantRoleId of roleAccesses) {
				const tenantRole = await TenantRoleRepository.getById(tenantRoleId)
				if (!tenantRole) {
					invalidFields.push({
						field: "roleAccesses",
						message: "Tenant role not found",
					})
				}
			}
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateAssignmentUserAttemptAnswerSchema(
	c: Context,
	next: Next,
) {
	const data: AssignmentUserAttemptAnswerDTO = await c.req.json()

	const invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		AssignmentUserAttemptAnswerSchema,
		data,
	)
	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	const assignmentQuestion = await prisma.assignmentQuestion.findUnique({
		where: {
			id: data.assignmentQuestionId,
		},
	})
	if (!assignmentQuestion) {
		invalidFields.push({
			field: "assignmentQuestionId",
			message: "Assignment question not found",
		})
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	switch (assignmentQuestion!.type) {
		case AssignmentQuestionType.MULTIPLE_CHOICE:
			if (!data.optionAnswerId) {
				invalidFields.push({
					field: "optionAnswerId",
					message: "Option answer id is required for multiple choice question",
				})
			} else {
				const assignmentQuestionOption =
					await prisma.assignmentQuestionOption.findUnique({
						where: {
							id: data.optionAnswerId,
							assignmentQuestionId: data.assignmentQuestionId,
						},
					})

				if (!assignmentQuestionOption) {
					invalidFields.push({
						field: "optionAnswerId",
						message: "Option answer id is not found",
					})
				}
			}
			break
		case AssignmentQuestionType.ESSAY:
			if (!data.essayAnswer) {
				invalidFields.push({
					field: "essayAnswer",
					message: "Essay answer is required for essay question",
				})
			}
			break
		case AssignmentQuestionType.TRUE_FALSE:
			if (!data.trueFalseAnswer) {
				invalidFields.push({
					field: "trueFalseAnswer",
					message: "True false answer is required for true false question",
				})
			}
			break
		default:
			invalidFields.push({
				field: "type",
				message: "Type is not valid",
			})
			break
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}
	await next()
}
