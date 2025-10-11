import { MasterKnowledgeCategory } from "../../generated/prisma/client"
import { MasterKnowledgeCategoryDTO } from "$entities/MasterKnowledgeCategory"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as MasterKnowledgeCategoryRepository from "$repositories/MasterKnowledgeCategoryRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
    data: MasterKnowledgeCategoryDTO
): Promise<ServiceResponse<MasterKnowledgeCategory | {}>> {
    try {
        const createdData = await MasterKnowledgeCategoryRepository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`MasterKnowledgeCategoryService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeCategory[]> | {}>> {
    try {
        const data = await MasterKnowledgeCategoryRepository.getAll(filters)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`MasterKnowledgeCategoryService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(id: string): Promise<ServiceResponse<MasterKnowledgeCategory | {}>> {
    try {
        let masterKnowledgeCategory = await MasterKnowledgeCategoryRepository.getById(id)

        if (!masterKnowledgeCategory)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(masterKnowledgeCategory)
    } catch (err) {
        Logger.error(`MasterKnowledgeCategoryService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = MasterKnowledgeCategory | {}
export async function update(
    id: string,
    data: MasterKnowledgeCategoryDTO
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        let masterKnowledgeCategory = await MasterKnowledgeCategoryRepository.getById(id)

        if (!masterKnowledgeCategory)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        masterKnowledgeCategory = await MasterKnowledgeCategoryRepository.update(id, data)

        return HandleServiceResponseSuccess(masterKnowledgeCategory)
    } catch (err) {
        Logger.error(`MasterKnowledgeCategoryService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
    try {
        await MasterKnowledgeCategoryRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`MasterKnowledgeCategoryService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
