import { z } from "zod"
export const AiChatRoomSchema = z
    .strictObject({
        title: z.string({
            error: (issue) => issue.input === undefined ? "title is required" : undefined
        }),
    })
    .strict()

export const AiChatRoomMessageSchema = z
    .strictObject({
        question: z.string({
            error: (issue) => issue.input === undefined ? "question is required" : undefined
        }),
    })
    .strict()
