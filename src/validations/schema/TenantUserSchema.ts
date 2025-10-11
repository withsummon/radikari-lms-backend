import z from "zod"

export const TenantUserUpdateSchema = z
    .strictObject({
        tenantRoleId: z.string({ required_error: "Tenant Role ID is required" }),
        userId: z.string({ required_error: "User ID is required" }),
    })
    .strict()
