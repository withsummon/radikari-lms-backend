import { z } from "zod"
export const AnnouncementSchema = z
    .strictObject({
        title: z.string({ required_error: "title is required" }),
        content: z.string({ required_error: "content is required" }),
        tenantRoleIds: z.array(z.string({ required_error: "tenantRoleIds is required" })),
    })
    .strict()
