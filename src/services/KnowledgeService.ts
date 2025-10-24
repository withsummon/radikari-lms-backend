import {
    Knowledge,
    KnowledgeActivityLogAction,
    KnowledgeAttachment,
    KnowledgeStatus,
    UserKnowledge,
} from "../../generated/prisma/client"
import { KnowledgeApprovalDTO, KnowledgeDTO, KnowledgeQueueDTO } from "$entities/Knowledge"
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
import { PUBSUB_TOPICS } from "$entities/PubSub"
import { GlobalPubSub } from "$pkg/pubsub"

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

        if (updatedKnowledge.status == KnowledgeStatus.APPROVED) {
            const pubsub = GlobalPubSub.getInstance().getPubSub()
            const knowledgeWithUserKnowledgeAndKnowledgeAttachment =
                await KnowledgeRepository.getById(id)

            await pubsub.sendToQueue(
                PUBSUB_TOPICS.KNOWLEDGE_UPDATE,
                generateKnowledgeQueueDTO(knowledgeWithUserKnowledgeAndKnowledgeAttachment as any)
            )
        }

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
        const pubsub = GlobalPubSub.getInstance().getPubSub()
        await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_DELETE, {
            knowledgeId: id,
        })
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
        if (status == knowledge.status) {
            return HandleServiceResponseCustomError(
                `Knowledge is already in status ${status}`,
                ResponseStatus.BAD_REQUEST
            )
        }

        // Todo handle comment when action is REVISION
        await KnowledgeRepository.updateStatus(id, userId, status, data.action)

        if (data.action == KnowledgeActivityLogAction.APPROVE) {
            const pubsub = GlobalPubSub.getInstance().getPubSub()

            await pubsub.sendToQueue(
                PUBSUB_TOPICS.KNOWLEDGE_CREATE,
                generateKnowledgeQueueDTO(knowledge as any)
            )
        }

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`KnowledgeService.approveById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

function generateKnowledgeQueueDTO(
    knowledge: Knowledge & { userKnowledge: UserKnowledge[] } & {
        knowledgeAttachment: KnowledgeAttachment[]
    }
): KnowledgeQueueDTO {
    return {
        metadata: {
            knowledgeId: knowledge.id,
            type: knowledge.type,
            access: knowledge.access,
            tenantId: knowledge.access == "TENANT" ? knowledge.tenantId : null,
            accessUserIds: Array.from(
                new Set([
                    ...knowledge.userKnowledge.map((userKnowledge: any) => userKnowledge.user.id),
                    knowledge.createdByUserId,
                ])
            ),
        },
        fileType: knowledge.knowledgeAttachment
            .map((attachment: any) => attachment.attachmentUrl.split(".").pop())
            .includes("pdf")
            ? "PDF"
            : "IMAGE",
        fileUrls: knowledge.knowledgeAttachment.map((attachment: any) => attachment.attachmentUrl),
        content: generateContentKnowledge(knowledge),
    }
}

function generateContentKnowledge(knowledge: any) {
    return `
        Headline: ${knowledge.headline}
        Category: ${knowledge.category}
        Sub Category: ${knowledge.subCategory}
        Case: ${knowledge.case}
        Knowledge Content: 
            ${knowledge.knowledgeContent
                .map(
                    (content: any) => `Title: ${content.title}, Description: ${content.description}`
                )
                .join("\n")}
    `
}
