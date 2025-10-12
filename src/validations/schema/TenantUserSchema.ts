import z from "zod"

export const TenantUserUpdateSchema = z
    .strictObject({
        tenantRoleId: z.string({ required_error: "Tenant Role ID is required" }),
        userId: z.string({ required_error: "User ID is required" }),
        headOfOperationUserId: z
            .string({ required_error: "Head of Operation User ID is required" })
            .optional(),
        teamLeaderUserId: z
            .string({ required_error: "Team Leader User ID is required" })
            .optional(),
        supervisorUserId: z.string({ required_error: "Supervisor User ID is required" }).optional(),
        managerUserId: z.string({ required_error: "Manager User ID is required" }).optional(),
    })
    .strict()
