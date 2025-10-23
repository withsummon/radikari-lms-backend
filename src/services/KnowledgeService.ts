import {
    Knowledge,
    KnowledgeActivityLogAction,
    KnowledgeStatus,
} from "../../generated/prisma/client"
import { KnowledgeApprovalDTO, KnowledgeDTO } from "$entities/Knowledge"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as KnowledgeRepository from "$repositories/KnowledgeRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import { UserJWTDAO } from "$entities/User"

export async function create(
    userId: string,
    tenantId: string,
    data: KnowledgeDTO
): Promise<ServiceResponse<Knowledge | {}>> {
    try {
        const createdData = await KnowledgeRepository.create(userId, tenantId, data)

        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`KnowledgeService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    user: UserJWTDAO,
    tenantId: string,
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<Knowledge[]> | {}>> {
    try {
        const data = await KnowledgeRepository.getAll(user, tenantId, filters)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`KnowledgeService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(
    id: string,
    tenantId: string
): Promise<ServiceResponse<Knowledge | {}>> {
    try {
        let knowledge = await KnowledgeRepository.getById(id)

        if (!knowledge)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(knowledge)
    } catch (err) {
        Logger.error(`KnowledgeService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Knowledge | {}
export async function update(
    id: string,
    tenantId: string,
    data: KnowledgeDTO
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const knowledge = await KnowledgeRepository.getById(id)

        if (!knowledge)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const updatedKnowledge = await KnowledgeRepository.update(id, data, tenantId)

        return HandleServiceResponseSuccess(updatedKnowledge)
    } catch (err) {
        Logger.error(`KnowledgeService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string, tenantId: string): Promise<ServiceResponse<{}>> {
    try {
        const knowledge = await KnowledgeRepository.getById(id)

        if (!knowledge)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await KnowledgeRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`KnowledgeService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function approveById(
    id: string,
    tenantId: string,
    userId: string,
    data: KnowledgeApprovalDTO
): Promise<ServiceResponse<{}>> {
    try {
        const knowledge = await KnowledgeRepository.getById(id)

        if (!knowledge)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        let status: KnowledgeStatus

        switch (data.action) {
            case KnowledgeActivityLogAction.APPROVE:
                status = KnowledgeStatus.APPROVED
                break
            case KnowledgeActivityLogAction.REJECT:
                status = KnowledgeStatus.REJECTED
                break
            case KnowledgeActivityLogAction.REVISION:
                status = KnowledgeStatus.REVISION
                break
            default:
                status = KnowledgeStatus.PENDING
                break
        }
        // Todo handle comment when action is REVISION
        await KnowledgeRepository.updateStatus(id, userId, status, data.action)

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`KnowledgeService.approveById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
