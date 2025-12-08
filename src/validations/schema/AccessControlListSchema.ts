import z from "zod"

export const AccessControlListUpdateAccessSchema = z
    .object({
        enabledFeatures: z.record(
            z.string(),
            z.boolean({
                error: (issue) =>
                    issue.input === undefined ? "enabledFeatures is required" : undefined,
            })
        ),
    })
    .strict()

export const AccessControlListCreateRoleSchema = z.object({
    name: z.string({
        error: (issue) => (issue.input === undefined ? "name is required" : undefined),
    }),
    description: z.string({
        error: (issue) => (issue.input === undefined ? "description is required" : undefined),
    }),
    level: z.number({
        error: (issue) => (issue.input === undefined ? "level is required" : undefined),
    }),
    identifier: z.string({
        error: (issue) => (issue.input === undefined ? "identifier is required" : undefined),
    }),
})
