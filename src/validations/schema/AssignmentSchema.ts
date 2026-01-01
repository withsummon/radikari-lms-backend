import { z } from "zod"
import {
	AssignmentAccess,
	AssignmentQuestionType,
} from "../../../generated/prisma/client"

export const AssignmentSchema = z
	.strictObject({
		title: z.string({
			error: (issue) =>
				issue.input === undefined ? "title is required" : undefined,
		}),
		durationInMinutes: z.number({
			error: (issue) =>
				issue.input === undefined ? "durationInMinutes is required" : undefined,
		}),
		expiredDate: z.string({
			error: (issue) =>
				issue.input === undefined ? "expiredDate is required" : undefined,
		}),
		access: z.enum(Object.values(AssignmentAccess) as [string, ...string[]], {
			error: (issue) =>
				issue.input === undefined ? "access is required" : undefined,
		}),
		isRandomized: z.boolean().optional(),
		showQuestion: z.boolean().optional(),
		showAnswer: z.boolean().optional(),
	})
	.strict()

export const AssignmentTenantRoleAccessSchema = z.array(
	z.string({
		error: (issue) =>
			issue.input === undefined ? "tenantRoleId is required" : undefined,
	}),
)

export const AssignmentQuestionSchema = z
	.strictObject({
		content: z.string({
			error: (issue) =>
				issue.input === undefined ? "content is required" : undefined,
		}),
		points: z.number().default(1),
		type: z.enum(
			Object.values(AssignmentQuestionType) as [string, ...string[]],
			{
				error: (issue) =>
					issue.input === undefined ? "type is required" : undefined,
			},
		),
		order: z.number({
			error: (issue) =>
				issue.input === undefined ? "order is required" : undefined,
		}),
		id: z.string().optional(),
	})
	.strict()

export const AssignmentQuestionOptionSchema = z.array(
	z
		.strictObject({
			content: z.string({
				error: (issue) =>
					issue.input === undefined ? "content is required" : undefined,
			}),
			isCorrectAnswer: z.boolean({
				error: (issue) =>
					issue.input === undefined ? "isCorrectAnswer is required" : undefined,
			}),
			id: z.string().optional(),
		})
		.strict(),
)

export const AssignmentQuestionTrueFalseAnswerSchema = z
	.strictObject({
		correctAnswer: z.boolean({
			error: (issue) =>
				issue.input === undefined ? "correctAnswer is required" : undefined,
		}),
		id: z.string().optional(),
	})
	.strict()

export const AssignmentQuestionEssayReferenceAnswerSchema = z
	.strictObject({
		content: z.string({
			error: (issue) =>
				issue.input === undefined ? "content is required" : undefined,
		}),
		id: z.string().optional(),
	})
	.strict()

export const AssignmentUserAttemptAnswerSchema = z
	.strictObject({
		assignmentQuestionId: z.string({
			error: (issue) =>
				issue.input === undefined
					? "assignmentQuestionId is required"
					: undefined,
		}),
		optionAnswerId: z.string().optional(),
		essayAnswer: z.string().optional(),
		trueFalseAnswer: z.boolean().optional(),
	})
	.strict()
