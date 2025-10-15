import { Operation } from "../../generated/prisma/client"
import { OperationDTO } from "$entities/Operation"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as OperationRepository from "$repositories/OperationRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(data: OperationDTO): Promise<ServiceResponse<Operation | {}>> {
    try {
        const createdData = await OperationRepository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`OperationService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<Operation[]> | {}>> {
    try {
        const data = await OperationRepository.getAll(filters)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`OperationService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(id: string): Promise<ServiceResponse<Operation | {}>> {
    try {
        let operation = await OperationRepository.getById(id)

        if (!operation)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(operation)
    } catch (err) {
        Logger.error(`OperationService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Operation | {}
export async function update(
    id: string,
    data: OperationDTO
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        let operation = await OperationRepository.getById(id)

        if (!operation)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const operationUpdated = await OperationRepository.update(id, data)

        return HandleServiceResponseSuccess(operationUpdated)
    } catch (err) {
        Logger.error(`OperationService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
    try {
        await OperationRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`OperationService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
