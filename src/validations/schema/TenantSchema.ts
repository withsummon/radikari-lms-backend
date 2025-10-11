import { z } from "zod"
export const TenantSchema = z
    .strictObject({
        name: z.string({ required_error: "name is required" }),
        description: z.string({ required_error: "description is required" }),
    })
    .strict()
