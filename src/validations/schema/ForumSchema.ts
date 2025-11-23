import { z } from "zod"
export const ForumSchema = z
    .strictObject({
        title: z.string({ error: (issue) => issue.input === undefined ? "title is required" : undefined }),
        content: z.string({ error: (issue) => issue.input === undefined ? "content is required" : undefined }),
        attachmentUrls: z.array(z.string({ error: (issue) => issue.input === undefined ? "attachmentUrl is required" : undefined }).url()).optional(),
    })
    .strict()

export const ForumCommentSchema = z
    .strictObject({
        content: z.string({ error: (issue) => issue.input === undefined ? "content is required" : undefined }),
        replyToCommentId: z.string({ error: (issue) => issue.input === undefined ? "replyToCommentId is required" : undefined }).optional(),
    })
    .strict()
