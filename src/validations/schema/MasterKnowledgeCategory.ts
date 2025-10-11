import { z } from "zod"
export const MasterKnowledgeCategorySchema = z
    .strictObject({
        name: z.string({ required_error: "name is required" }),
    })
    .strict()
