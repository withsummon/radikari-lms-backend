import { z } from "zod/v4"
export const TenantSchema = z
    .strictObject({
        name: z.string({ required_error: "name is required" }),
        description: z.string({ required_error: "description is required" }),
        operationId: z.string({ required_error: "operationId is required" }),
    })
    .strict()
