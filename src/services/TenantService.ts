import { Prisma, Tenant } from "../../generated/prisma/client"
import { TenantDTO } from "$entities/Tenant"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as TenantRepository from "$repositories/TenantRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import { ulid } from "ulid"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function create(data: TenantDTO): Promise<ServiceResponse<Tenant | {}>> {
    try {
        const createdData = await TenantRepository.create(data)

        const tenantRoleCreateManyInput: Prisma.TenantRoleCreateManyInput[] = [
            {
                id: ulid(),
                identifier: "HEAD_OF_OFFICE",
                name: "Head of Office",
                description: "Head of Office",
                level: 1,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "OPS_MANAGER",
                name: "Ops Manager",
                description: "Ops Manager",
                level: 2,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "SUPPORT_MANAGER",
                name: "Support Manager",
                description: "Support Manager",
                level: 2,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "SUPERVISOR",
                name: "Supervisor",
                description: "Supervisor",
                level: 3,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "SUPPORT_SUPERVISOR",
                name: "Support Supervisor",
                description: "Support Supervisor",
                level: 3,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "TEAM_LEADER",
                name: "Team Leader",
                description: "Team Leader",
                level: 4,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "TRAINER",
                name: "Trainer",
                description: "Trainer",
                level: 4,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "QUALITY_ASSURANCE",
                name: "Quality Assurance",
                description: "Quality Assurance",
                level: 4,
                tenantId: createdData.id,
            },
            {
                id: ulid(),
                identifier: "AGENT",
                name: "Agent",
                description: "Agent",
                level: 5,
                tenantId: createdData.id,
            },
        ]

        await TenantRoleRepository.createMany(tenantRoleCreateManyInput)
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
    data: TenantDTO
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const tenant = await TenantRepository.getById(id)

        if (!tenant) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const updatedTenant = await TenantRepository.update(id, data)

        return HandleServiceResponseSuccess(updatedTenant)
    } catch (err) {
        Logger.error(`TenantService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
    try {
        await TenantRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`TenantService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
