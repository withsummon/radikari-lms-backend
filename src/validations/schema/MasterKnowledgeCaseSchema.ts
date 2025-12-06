import { z } from "zod"
export const MasterKnowledgeCaseSchema = z
	.strictObject({
		name: z.string({
			error: (issue) =>
				issue.input === undefined ? "name is required" : undefined,
		}),
	})
	.strict()
