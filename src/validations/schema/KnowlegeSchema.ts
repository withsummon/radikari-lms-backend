import { z } from "zod"
import { KnowledgeActivityLogAction } from "../../../generated/prisma/client"

export const KnowledgeBulkCreateSchema = z.object({
	access: z.enum(["PUBLIC", "TENANT", "EMAIL"], {
		error: (issue) =>
			issue.input === undefined ? "access is required" : undefined,
	}),
	type: z.enum(["ARTICLE", "CASE"], {
		error: (issue) =>
			issue.input === undefined
				? "type is required"
				: `invalid option: expected one of "CASE"|"ARTICLE"`,
	}),
	emails: z
		.array(
			z.string({
				error: (issue) =>
					issue.input === undefined ? "emails is required" : undefined,
			}),
		)
		.optional(),
	fileUrl: z.string({
		error: (issue) =>
			issue.input === undefined ? "fileUrl is required" : undefined,
	}),
	tenantId: z.string().optional(),
})

export const KnowlegeSchema = z.object({
	parentId: z
		.string({
			error: (issue) =>
				issue.input === undefined ? "parentId is required" : undefined,
		})
		.optional(),
	category: z.string({
		error: (issue) =>
			issue.input === undefined ? "category is required" : undefined,
	}),
	subCategory: z.string({
		error: (issue) =>
			issue.input === undefined ? "subCategory is required" : undefined,
	}),
	type: z.enum(["ARTICLE", "CASE"], {
		error: (issue) =>
			issue.input === undefined
				? "type is required"
				: `invalid option: expected one of "CASE"|"ARTICLE"`,
	}),
	access: z.enum(["PUBLIC", "TENANT", "EMAIL"], {
		error: (issue) =>
			issue.input === undefined ? "access is required" : undefined,
	}),
	case: z.string({
		error: (issue) =>
			issue.input === undefined ? "case is required" : undefined,
	}),
	headline: z.string({
		error: (issue) =>
			issue.input === undefined ? "headline is required" : undefined,
	}),
	attachments: z
		.array(
			z.object({
				attachmentUrl: z.string({
					error: (issue) =>
						issue.input === undefined ? "attachmentUrl is required" : undefined,
				}),
			}),
		)
		.optional(),
	contents: z.array(
		z.object({
			title: z.string({
				error: (issue) =>
					issue.input === undefined ? "title is required" : undefined,
			}),
			description: z.string({
				error: (issue) =>
					issue.input === undefined ? "description is required" : undefined,
			}),
			order: z.number({
				error: (issue) =>
					issue.input === undefined ? "order is required" : undefined,
			}),
			attachments: z
				.array(
					z.object({
						order: z.number({
							error: (issue) =>
								issue.input === undefined ? "order is required" : undefined,
						}),
						attachmentUrl: z.string({
							error: (issue) =>
								issue.input === undefined
									? "attachmentUrl is required"
									: undefined,
						}),
					}),
				)
				.optional(),
		}),
	),
	emails: z
		.array(
			z.string({
				error: (issue) =>
					issue.input === undefined ? "emails is required" : undefined,
			}),
		)
		.optional(),
})

export const KnowledgeApprovalSchema = z
	.strictObject({
		action: z.enum(
			[
				KnowledgeActivityLogAction.APPROVE,
				KnowledgeActivityLogAction.REJECT,
				KnowledgeActivityLogAction.REVISION,
			],
			{
				error: (issue) =>
					issue.input === undefined ? "action is required" : undefined,
			},
		),
		comment: z
			.string({
				error: (issue) =>
					issue.input === undefined ? "comment is required" : undefined,
			})
			.optional(),
	})
	.strict()
