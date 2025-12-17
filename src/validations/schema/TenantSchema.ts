import { z } from "zod/v4"
export const TenantSchema = z
	.strictObject({
		name: z.string({
			error: (issue) =>
				issue.input === undefined ? "name is required" : "Invalid string",
		}),
		description: z.string({
			error: (issue) =>
				issue.input === undefined
					? "description is required"
					: "Invalid string",
		}),
		operationId: z.string({
			error: (issue) =>
				issue.input === undefined
					? "operationId is required"
					: "Invalid string",
		}),
		headOfTenantUserId: z
			.string({
				error: (issue) =>
					issue.input === undefined
						? "headOfTenantUserId is required"
						: "Invalid string",
			})
			.optional(),
		tokenLimit: z.number().optional(),
	})
	.strict()
