import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { AssignmentCreateDTO } from "$entities/Assignment"
import {
    AssignmentSchema,
    AssignmentTenantRoleAccessSchema,
    AssignmentQuestionSchema,
    AssignmentQuestionOptionSchema,
    AssignmentQuestionEssayReferenceAnswerSchema,
    AssignmentQuestionTrueFalseAnswerSchema,
} from "./schema/AssignmentSchema"
import * as Helpers from "./helper"
import { AssignmentAccess, AssignmentQuestionType } from "../../generated/prisma/client"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function validateAssignmentSchema(c: Context, next: Next) {
    const data: AssignmentCreateDTO = await c.req.json()
    const { roleAccesses, userEmails, questions, ...rest } = data

    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(AssignmentSchema, rest)

    switch (data.access) {
        case AssignmentAccess.TENANT_ROLE:
            invalidFields.push(
                ...Helpers.validateSchema(AssignmentTenantRoleAccessSchema, roleAccesses)
            )
            break
        case AssignmentAccess.USER:
            if (userEmails.length === 0) {
                invalidFields.push({ field: "userEmails", message: "User emails are required" })
            }
            break
    }

    for (const question of questions) {
        const { options, trueFalseAnswer, essayReferenceAnswer, ...questionRest } = question

        invalidFields.push(...Helpers.validateSchema(AssignmentQuestionSchema, questionRest))

        switch (question.type) {
            case AssignmentQuestionType.MULTIPLE_CHOICE:
                invalidFields.push(
                    ...Helpers.validateSchema(AssignmentQuestionOptionSchema, options)
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
                            essayReferenceAnswer
                        )
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
                            trueFalseAnswer
                        )
                    )
                }
                break
        }
    }

    // Validate unique order
    const orderMap = new Map<number, number>()
    for (const question of questions) {
        if (orderMap.has(question.order)) {
            invalidFields.push({ field: "questions", message: "Order must be unique" })
        }
        orderMap.set(question.order, question.order)
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    // Validate Foreign Keys
    if (data.access === AssignmentAccess.TENANT_ROLE) {
        for (const tenantRoleId of roleAccesses) {
            const tenantRole = await TenantRoleRepository.getById(tenantRoleId)
            if (!tenantRole || tenantRole === null) {
                invalidFields.push({ field: "roleAccesses", message: "Tenant role not found" })
            }
        }
    }

    await next()
}
