import { z } from "zod"
export const OperationSchema = z
    .strictObject({
        name: z.string({ required_error: "name is required" }),
        description: z.string({ required_error: "description is required" }),
        headOfOperationUserId: z.string({ required_error: "headOfOperationUserId is required" }),
    })
    .strict()
