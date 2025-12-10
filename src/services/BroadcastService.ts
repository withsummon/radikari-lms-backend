import { Broadcast } from "../../generated/prisma/client"
import { BroadcastDTO } from "$entities/Broadcast"
import * as BroadcastRepository from "$repositories/BroadcastRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as TenantRepository from "$repositories/TenantRepository"

export async function getByTenantId(tenantId: string): Promise<ServiceResponse<Broadcast | {}>> {
    try {
        const broadcast = await BroadcastRepository.getByTenantId(tenantId)
        if (!broadcast)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)
        return HandleServiceResponseSuccess(broadcast)
    } catch (err) {
        Logger.error(`BroadcastService.getByTenantId`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Broadcast | {}
export async function upsertByTenantId(
    tenantId: string,
    data: BroadcastDTO,
    userId: string
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const tenant = await TenantRepository.getById(tenantId)
        if (!tenant)
            return HandleServiceResponseCustomError("Invalid Tenant ID", ResponseStatus.NOT_FOUND)

        data.createdByUserId = userId
        data.updatedByUserId = userId
        data.tenantId = tenantId
        const broadcast = await BroadcastRepository.upsertByTenantId(tenantId, data)

        return HandleServiceResponseSuccess(broadcast)
    } catch (err) {
        Logger.error(`BroadcastService.upsertByTenantId`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

