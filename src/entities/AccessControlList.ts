export interface AccessControlListDTO {
    enabledFeatures: Record<string, boolean>
}

export interface ACLMappingInputDTO {
    id: string
    featureName: string
    actionName: string
    tenantRoleId: string
    createdById: string
    updatedById: string
}
