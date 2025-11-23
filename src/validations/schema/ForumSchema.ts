import { z } from "zod"
export const ForumSchema = z
    .strictObject({
        title: z.string({ required_error: "title is required" }),
        content: z.string({ required_error: "content is required" }),
        attachmentUrls: z.array(z.string({ required_error: "attachmentUrls is required" })),
    })
    .strict()

export const ForumCommentSchema = z
    .strictObject({
        content: z.string({ required_error: "content is required" }),
        replyToCommentId: z.string({ required_error: "replyToCommentId is required" }).optional(),
    })
    .strict()
