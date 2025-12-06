import { z } from "zod"
export const MasterKnowledgeCategorySchema = z
	.strictObject({
		name: z.string({
			error: (issue) =>
				issue.input === undefined ? "name is required" : undefined,
		}),
	})
	.strict()
