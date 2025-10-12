export interface TenantUserUpdateDTO {
    tenantRoleId: string
    userId: string
    headOfOperationUserId?: string
    teamLeaderUserId?: string
    supervisorUserId?: string
    managerUserId?: string
}
