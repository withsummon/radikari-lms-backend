import { z } from "zod"
export const OperationSchema = z
    .strictObject({
        name: z.string({
            error: "name is required",
        }),
        description: z.string({
            error: "description is required",
        }),
        headOfOperationUserId: z.string({
            error: "headOfOperationUserId is required",
        }),
    })
    .strict()
