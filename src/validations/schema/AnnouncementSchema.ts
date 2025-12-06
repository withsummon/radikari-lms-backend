import { z } from "zod"
export const AnnouncementSchema = z
	.strictObject({
		title: z.string({
			error: (issue) =>
				issue.input === undefined ? "title is required" : undefined,
		}),
		content: z.string({
			error: (issue) =>
				issue.input === undefined ? "content is required" : undefined,
		}),
		tenantRoleIds: z.array(
			z.string({
				error: (issue) =>
					issue.input === undefined ? "tenantRoleId is required" : undefined,
			}),
		),
	})
	.strict()
