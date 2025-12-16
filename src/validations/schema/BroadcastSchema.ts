import { z } from "zod"
export const BroadcastSchema = z
	.strictObject({
		content: z.string({
			error: (issue) =>
				issue.input === undefined ? "content is required" : undefined,
		}),
	})
	.strict()
