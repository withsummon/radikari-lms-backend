import { z } from "zod"
export const AiChatRoomSchema = z
    .strictObject({
        title: z.string({ required_error: "title is required" }),
    })
    .strict()

export const AiChatRoomMessageSchema = z
    .strictObject({
        question: z.string({ required_error: "question is required" }),
    })
    .strict()
