import { Assignment } from "../../generated/prisma/client"
import { AssignmentCreateDTO } from "$entities/Assignment"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as AssignmentRepository from "$repositories/Assignment"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import { UserJWTDAO } from "$entities/User"

export async function create(
    data: AssignmentCreateDTO,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<Assignment | {}>> {
    try {
        data.tenantId = tenantId
        data.createdByUserId = userId

        const createdData = await AssignmentRepository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`AssignmentService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery,
    user: UserJWTDAO,
    tenantId: string
): Promise<ServiceResponse<EzFilter.PaginatedResult<Assignment[]> | {}>> {
    try {
        const data = await AssignmentRepository.getAll(filters, user, tenantId)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`AssignmentService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(
    id: string,
    tenantId: string
): Promise<ServiceResponse<Assignment | {}>> {
    try {
        let assginment = await AssignmentRepository.getById(id, tenantId)

        if (!assginment)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(assginment)
    } catch (err) {
        Logger.error(`AssignmentService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Assignment | {}
export async function update(
    id: string,
    data: AssignmentCreateDTO,
    tenantId: string
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const assginment = await AssignmentRepository.getById(id, tenantId)

        if (!assginment)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const updatedAssginment = await AssignmentRepository.update(id, data)

        return HandleServiceResponseSuccess(updatedAssginment)
    } catch (err) {
        Logger.error(`AssignmentService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string, tenantId: string): Promise<ServiceResponse<{}>> {
    try {
        await AssignmentRepository.deleteById(id, tenantId)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`AssignmentService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
