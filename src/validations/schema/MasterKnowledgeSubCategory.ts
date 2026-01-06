import { z } from "zod"

export const MasterKnowledgeSubCategorySchema = z
	.strictObject({
		id: z.string().optional(),
		name: z.string({
			error: (issue) =>
				issue.input === undefined ? "name is required" : undefined,
		}),
		categoryId: z.string({
			error: (issue) =>
				issue.input === undefined ? "categoryId is required" : undefined,
		}),
	})
	.strict()
