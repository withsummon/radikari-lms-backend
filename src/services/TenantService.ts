import { Tenant } from "../../generated/prisma/client"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as TenantRepository from "$repositories/TenantRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as UserActivityLogService from "$services/UserActivityLogService"

export async function create(
    data: TenantCreateUpdateDTO,
    userId: string
): Promise<ServiceResponse<Tenant | {}>> {
    try {
        const createdData = await TenantRepository.create(data)

        await UserActivityLogService.create(
            userId,
            "Menambahkan tenant",
            "default",
            `dengan nama "${createdData.name}"`
        )

        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`TenantService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<Tenant[]> | {}>> {
    try {
        const data = await TenantRepository.getAll(filters)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`TenantService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(id: string): Promise<ServiceResponse<Tenant | {}>> {
    try {
        let tenant = await TenantRepository.getById(id)

        if (!tenant) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(tenant)
    } catch (err) {
        Logger.error(`TenantService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Tenant | {}
export async function update(
    id: string,
    data: TenantCreateUpdateDTO,
    userId: string
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const tenant = await TenantRepository.getById(id)

        if (!tenant) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const updatedTenant = await TenantRepository.update(id, data)

        await UserActivityLogService.create(
            userId,
            "Mengedit tenant",
            "default",
            `dengan nama "${updatedTenant.name}"`
        )

        return HandleServiceResponseSuccess(updatedTenant)
    } catch (err) {
        Logger.error(`TenantService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string, userId: string): Promise<ServiceResponse<{}>> {
    try {
        const tenant = await TenantRepository.getById(id)
        if (!tenant) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await TenantRepository.deleteById(id)

        await UserActivityLogService.create(
            userId,
            "Menghapus tenant",
            "default",
            `dengan nama "${tenant.name}"`
        )

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`TenantService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAllByUserId(
    filters: EzFilter.FilteringQuery,
    userId: string
): Promise<ServiceResponse<EzFilter.PaginatedResult<Tenant[]> | {}>> {
    try {
        const tenants = await TenantRepository.getAllByUserId(filters, userId)
        return HandleServiceResponseSuccess(tenants)
    } catch (err) {
        Logger.error(`TenantService.getAllByUserId`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
