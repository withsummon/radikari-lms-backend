export interface TenantDTO {
    id: string
    name: string
    description: string
    operationId: string
}

export interface TenantCreateUpdateDTO extends TenantDTO {
    headOfTenantUserId: string
}
