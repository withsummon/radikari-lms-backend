import { z } from "zod"
export const OperationSchema = z
    .strictObject({
        name: z.string({
            error: (issue) => issue.input === undefined ? "name is required" : undefined
        }),
        description: z.string({
            error: (issue) => issue.input === undefined ? "description is required" : undefined
        }),
        headOfOperationUserId: z.string({
            error: (issue) => issue.input === undefined ? "headOfOperationUserId is required" : undefined
        }),
    })
    .strict()
