import {
	HandleServiceResponseCustomError,
	ServiceResponse,
} from "$entities/Service"
import { HandleServiceResponseSuccess } from "$entities/Service"
import Logger from "$pkg/logger"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function getAll(): Promise<ServiceResponse<{}>> {
	try {
		const tenantRoles = await TenantRoleRepository.getAll()

		return HandleServiceResponseSuccess(tenantRoles)
	} catch (error) {
		Logger.error(`TenantRoleService.getAll`, {
			error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}
