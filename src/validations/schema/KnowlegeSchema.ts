import { z } from "zod"
import {
	KnowledgeAccess,
	KnowledgeActivityLogAction,
	KnowledgeType,
} from "../../../generated/prisma/client"
export const KnowlegeSchema = z
	.strictObject({
		category: z.string({
			error: (issue) =>
				issue.input === undefined ? "category is required" : undefined,
		}),
		subCategory: z.string({
			error: (issue) =>
				issue.input === undefined ? "subCategory is required" : undefined,
		}),
		type: z.enum([KnowledgeType.ARTICLE, KnowledgeType.CASE], {
			error: (issue) =>
				issue.input === undefined ? "type is required" : undefined,
		}),
		access: z.enum(
			[KnowledgeAccess.PUBLIC, KnowledgeAccess.TENANT, KnowledgeAccess.EMAIL],
			{
				error: (issue) =>
					issue.input === undefined ? "access is required" : undefined,
			},
		),
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
							issue.input === undefined
								? "attachmentUrl is required"
								: undefined,
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
	.strict()

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
