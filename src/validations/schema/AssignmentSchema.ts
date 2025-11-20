import { z } from "zod"
import { AssignmentAccess, AssignmentQuestionType } from "../../../generated/prisma/client"

export const AssignmentSchema = z
    .strictObject({
        title: z.string({ required_error: "title is required" }),
        durationInMinutes: z.number({ required_error: "durationInMinutes is required" }),
        expiredDate: z.string({ required_error: "expiredDate is required" }),
        access: z.enum(Object.values(AssignmentAccess) as [string, ...string[]], {
            required_error: "access is required",
        }),
    })
    .strict()

export const AssignmentTenantRoleAccessSchema = z.array(
    z.string({ required_error: "tenantRoleId is required" })
)

export const AssignmentQuestionSchema = z
    .strictObject({
        content: z.string({ required_error: "content is required" }),
        type: z.enum(Object.values(AssignmentQuestionType) as [string, ...string[]], {
            required_error: "type is required",
        }),
        order: z.number({ required_error: "order is required" }),
    })
    .strict()

export const AssignmentQuestionOptionSchema = z.array(
    z
        .strictObject({
            content: z.string({ required_error: "content is required" }),
            isCorrectAnswer: z.boolean({ required_error: "isCorrectAnswer is required" }),
        })
        .strict()
)

export const AssignmentQuestionTrueFalseAnswerSchema = z
    .strictObject({
        correctAnswer: z.boolean({ required_error: "correctAnswer is required" }),
    })
    .strict()

export const AssignmentQuestionEssayReferenceAnswerSchema = z
    .strictObject({
        content: z.string({ required_error: "content is required" }),
    })
    .strict()

export const AssignmentUserAttemptAnswerSchema = z
    .strictObject({
        assignmentQuestionId: z.string({ required_error: "assignmentQuestionId is required" }),
        optionAnswerId: z.string().optional(),
        essayAnswer: z.string().optional(),
        trueFalseAnswer: z.boolean().optional(),
    })
    .strict()
