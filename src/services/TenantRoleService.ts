import {
    HandleServiceResponseCustomError,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import { HandleServiceResponseSuccess } from "$entities/Service"
import Logger from "$pkg/logger"
import * as TenantRepository from "$repositories/TenantRepository"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function getByTenantId(tenantId: string): Promise<ServiceResponse<{}>> {
    try {
        const tenant = await TenantRepository.getById(tenantId)

        if (!tenant) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const tenantRoles = await TenantRoleRepository.getByTenantId(tenantId)

        return HandleServiceResponseSuccess(tenantRoles)
    } catch (error) {
        Logger.error(`TenantRoleService.getByTenantId`, {
            error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
