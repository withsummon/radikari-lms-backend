import { z } from "zod"
export const MasterKnowledgeCaseSchema = z
    .strictObject({
        name: z.string({ required_error: "name is required" }),
    })
    .strict()
