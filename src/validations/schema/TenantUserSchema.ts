import z from "zod"

export const TenantUserUpdateSchema = z
    .strictObject({
        tenantRoleId: z.string({
            error: (issue) =>
                issue.input === undefined ? "Tenant Role ID is required" : undefined,
        }),
        userId: z.string({
            error: (issue) => (issue.input === undefined ? "User ID is required" : undefined),
        }),
        headOfOperationUserId: z
            .string({
                error: (issue) =>
                    issue.input === undefined ? "Head of Operation User ID is required" : undefined,
            })
            .optional(),
        teamLeaderUserId: z
            .string({
                error: (issue) =>
                    issue.input === undefined ? "Team Leader User ID is required" : undefined,
            })
            .optional(),
        supervisorUserId: z
            .string({
                error: (issue) =>
                    issue.input === undefined ? "Supervisor User ID is required" : undefined,
            })
            .optional(),
        managerUserId: z
            .string({
                error: (issue) =>
                    issue.input === undefined ? "Manager User ID is required" : undefined,
            })
            .optional(),
    })
    .strict()
