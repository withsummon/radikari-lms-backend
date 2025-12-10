import { z } from "zod"
export const AiPromptSchema = z
    .strictObject({
        prompt: z.string({
            error: (issue) => (issue.input === undefined ? "prompt is required" : undefined),
        }),
    })
    .strict()
