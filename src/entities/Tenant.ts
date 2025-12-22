export interface TenantDTO {
	id: string
	name: string
	description: string
	operationId: string
}

export interface TenantCreateUpdateDTO extends Omit<TenantDTO, "operationId"> {
    operationId?: string
	headOfTenantUserId: string
	tokenLimit?: number
}
