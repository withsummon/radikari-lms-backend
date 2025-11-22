import { z } from "zod"
import { AssignmentAccess, AssignmentQuestionType } from "../../../generated/prisma/client"

export const AssignmentSchema = z
    .strictObject({
        title: z.string({
            error: (issue) => issue.input === undefined ? "title is required" : undefined
        }),
        durationInMinutes: z.number({
            error: (issue) => issue.input === undefined ? "durationInMinutes is required" : undefined
        }),
        expiredDate: z.string({
            error: (issue) => issue.input === undefined ? "expiredDate is required" : undefined
        }),
        access: z.enum(Object.values(AssignmentAccess) as [string, ...string[]], {
            error: (issue) => issue.input === undefined ? "access is required" : undefined
        }),
    })
    .strict()

export const AssignmentTenantRoleAccessSchema = z.array(
    z.string({
        error: (issue) => issue.input === undefined ? "tenantRoleId is required" : undefined
    })
)

export const AssignmentQuestionSchema = z
    .strictObject({
        content: z.string({
            error: (issue) => issue.input === undefined ? "content is required" : undefined
        }),
        type: z.enum(Object.values(AssignmentQuestionType) as [string, ...string[]], {
            error: (issue) => issue.input === undefined ? "type is required" : undefined
        }),
        order: z.number({
            error: (issue) => issue.input === undefined ? "order is required" : undefined
        }),
    })
    .strict()

export const AssignmentQuestionOptionSchema = z.array(
    z
        .strictObject({
            content: z.string({
                error: (issue) => issue.input === undefined ? "content is required" : undefined
            }),
            isCorrectAnswer: z.boolean({
                error: (issue) => issue.input === undefined ? "isCorrectAnswer is required" : undefined
            }),
        })
        .strict()
)

export const AssignmentQuestionTrueFalseAnswerSchema = z
    .strictObject({
        correctAnswer: z.boolean({
            error: (issue) => issue.input === undefined ? "correctAnswer is required" : undefined
        }),
    })
    .strict()

export const AssignmentQuestionEssayReferenceAnswerSchema = z
    .strictObject({
        content: z.string({
            error: (issue) => issue.input === undefined ? "content is required" : undefined
        }),
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
