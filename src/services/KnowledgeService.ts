import {
    Knowledge,
    KnowledgeActivityLogAction,
    KnowledgeAttachment,
    KnowledgeStatus,
    Prisma,
    UserKnowledge,
} from "../../generated/prisma/client"
import {
    KnowledgeApprovalDTO,
    KnowledgeBulkCreateDataRow,
    KnowledgeBulkCreateDTO,
    KnowledgeBulkCreateTypeCaseDataRow,
    KnowledgeDTO,
    KnowledgeQueueDTO,
} from "$entities/Knowledge"
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
import axios from "axios"
import * as XLSX from "xlsx"
import { ulid } from "ulid"
import * as TenantRepository from "$repositories/TenantRepository"
import * as OperationRepository from "$repositories/OperationRepository"

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

export async function getAllArchived(
    user: UserJWTDAO,
    tenantId: string,
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<Knowledge[]> | {}>> {
    try {
        const data = await KnowledgeRepository.getAllArchived(user, tenantId, filters)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`KnowledgeService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getSummary(
    user: UserJWTDAO,
    tenantId: string,
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<{}>> {
    try {
        const data = await KnowledgeRepository.getSummary(user, tenantId, filters)

        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`KnowledgeService.getSummary`, {
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
            Logger.info("KnowledgeService.approveById: Preparing to send message to queue.", {
                knowledgeId: knowledge.id,
                headline: knowledge.headline, // DEBUG: Log the headline from the DB object
            })

            const payload = generateKnowledgeQueueDTO(knowledge as any)

            Logger.info("KnowledgeService.approveById: Generated payload for queue.", {
                payload: payload, // DEBUG: Log the entire payload
            })

            const pubsub = GlobalPubSub.getInstance().getPubSub()

            await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_CREATE, payload)
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
            headline: knowledge.headline,
            // FIXED: Always include tenantId in metadata for AI service access control
            // The tenantId represents the context where this knowledge was created
            tenantId: knowledge.tenantId,
            accessUserIds:
                knowledge.access == "EMAIL"
                    ? Array.from(
                          new Set([
                              ...knowledge.userKnowledge.map(
                                  (userKnowledge: any) => userKnowledge.user.id
                              ),
                              knowledge.createdByUserId,
                          ])
                      )
                    : [],
        },
        fileType:
            knowledge.knowledgeAttachment && knowledge.knowledgeAttachment.length > 0
                ? knowledge.knowledgeAttachment
                      .map((attachment: any) => attachment.attachmentUrl.split(".").pop())
                      .includes("pdf")
                    ? "PDF"
                    : "IMAGE"
                : "",
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

export async function bulkCreate(data: KnowledgeBulkCreateDTO, userId: string) {
    try {
        const file = await axios.get(data.fileUrl, {
            responseType: "arraybuffer",
        })

        const responseData = file.data
        const workbook = XLSX.read(responseData, { type: "buffer" })
        const knowledges = workbook.Sheets[workbook.SheetNames[2]]

        const rowData: KnowledgeBulkCreateDataRow[] =
            XLSX.utils.sheet_to_json<KnowledgeBulkCreateDataRow>(knowledges)

        const knowledgeCreateManyInput: Prisma.KnowledgeCreateManyInput[] = []
        const knwoledgeAttachmentCreateManyInput: Prisma.KnowledgeAttachmentCreateManyInput[] = []
        const knwoledgeContentCreateManyInput: Prisma.KnowledgeContentCreateManyInput[] = []

        for (const row of rowData) {
            let tenantId: string | undefined
            if (row["Tenant Name"] && row["Tenant Name"] !== "") {
                let tenant = await TenantRepository.getByName(row["Tenant Name"])

                if (row["Tenant Name"] === "DANA") {
                    tenant = await TenantRepository.getById("01K9201Z97H20E4NKTEANCFVCP")
                }
                console.log("Tenant fetched or created:", tenant) // DEBUG LOG

                if (!tenant) {
                    const operation = await OperationRepository.findFirst()

                    tenant = await TenantRepository.create({
                        id: row["Tenant Name"] === "DANA" ? "01K9201Z97H20E4NKTEANCFVCP" : ulid(),
                        name: row["Tenant Name"],
                        description: row["Tenant Name"],
                        operationId: operation!.id,
                        headOfTenantUserId: userId,
                    })
                }

                tenantId = tenant.id
            }

            const knowledgeId = ulid()
            knowledgeCreateManyInput.push({
                id: knowledgeId,
                tenantId: tenantId,
                createdByUserId: userId,
                access: data.access,
                type: data.type,
                category: row.Category,
                subCategory: row["Sub Category"],
                case: row.Case,
                headline: row.Headline,
                status: KnowledgeStatus.APPROVED,
            })

            if (row.Attachments && row.Attachments !== "") {
                const attachments = row.Attachments.split(",")
                for (const attachment of attachments) {
                    knwoledgeAttachmentCreateManyInput.push({
                        id: ulid(),
                        knowledgeId: knowledgeId,
                        attachmentUrl: attachment,
                    })
                }
            }

            knwoledgeContentCreateManyInput.push({
                id: ulid(),
                knowledgeId: knowledgeId,
                title: row.Headline,
                description: row.Description,
                order: 1,
            })
        }

        await KnowledgeRepository.createMany(knowledgeCreateManyInput)
        await KnowledgeRepository.createManyAttachments(knwoledgeAttachmentCreateManyInput)
        await KnowledgeRepository.createManyContent(knwoledgeContentCreateManyInput)

        const pubsub = GlobalPubSub.getInstance().getPubSub()

        for (const knowledge of knowledgeCreateManyInput) {
            const knowledgeWithUserKnowledgeAndKnowledgeAttachment =
                await KnowledgeRepository.getById(knowledge.id)

            await pubsub.sendToQueue(
                PUBSUB_TOPICS.KNOWLEDGE_CREATE,
                generateKnowledgeQueueDTO(knowledgeWithUserKnowledgeAndKnowledgeAttachment as any)
            )
        }

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`KnowledgeService.bulkCreate`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function bulkCreateTypeCase(data: KnowledgeBulkCreateDTO, userId: string) {
    try {
        const file = await axios.get(data.fileUrl, {
            responseType: "arraybuffer",
        })

        const responseData = file.data
        const workbook = XLSX.read(responseData, { type: "buffer" })
        const knowledges = workbook.Sheets[workbook.SheetNames[2]]

        const rowData: KnowledgeBulkCreateTypeCaseDataRow[] =
            XLSX.utils.sheet_to_json<KnowledgeBulkCreateTypeCaseDataRow>(knowledges)

        const knowledgeCreateManyInput: Prisma.KnowledgeCreateManyInput[] = []
        const knwoledgeContentCreateManyInput: Prisma.KnowledgeContentCreateManyInput[] = []

        for (const row of rowData) {
            let tenantId: string | undefined
            if (row["Tenant Name"] && row["Tenant Name"] !== "") {
                let tenant = await TenantRepository.getByName(row["Tenant Name"])

                if (row["Tenant Name"] === "DANA") {
                    tenant = await TenantRepository.getById("01K9201Z97H20E4NKTEANCFVCP")
                }

                if (!tenant) {
                    const operation = await OperationRepository.findFirst()

                    tenant = await TenantRepository.create({
                        id: row["Tenant Name"] === "DANA" ? "01K9201Z97H20E4NKTEANCFVCP" : ulid(),
                        name: row["Tenant Name"],
                        description: row["Tenant Name"],
                        operationId: operation!.id,
                        headOfTenantUserId: userId,
                    })
                }

                tenantId = tenant.id
            }

            const knowledgeId = ulid()
            knowledgeCreateManyInput.push({
                id: knowledgeId,
                tenantId: tenantId,
                createdByUserId: userId,
                access: data.access,
                type: data.type,
                headline: row["Detail Case"],
                case: row["Case"],
                category: row["Category"],
                subCategory: row["Sub Category"],
                status: KnowledgeStatus.APPROVED,
            })

            let order = 1

            if (row["Merchant Name"] && row["Merchant Name"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Merchant Name",
                    description: row["Merchant Name"],
                    order: order++,
                })
            }

            if (row["Aggregator Name"] && row["Aggregator Name"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Aggregator Name",
                    description: row["Aggregator Name"],
                    order: order++,
                })
            }

            if (row["Probing"] && row["Probing"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Probing",
                    description: row["Probing"],
                    order: order++,
                })
            }

            if (row["NEED KBA?"] && row["NEED KBA?"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "NEED KBA?",
                    description: row["NEED KBA?"],
                    order: order++,
                })
            }

            if (row["FCR"] && row["FCR"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "FCR",
                    description: row["FCR"],
                    order: order++,
                })
            }

            if (row["Guidance"] && row["Guidance"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Guidance",
                    description: row["Guidance"],
                    order: order++,
                })
            }

            if (row["Note"] && row["Note"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Note",
                    description: row["Note"],
                    order: order++,
                })
            }

            if (row["SLA ESCALATION"] && row["SLA ESCALATION"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "SLA ESCALATION",
                    description: row["SLA ESCALATION"],
                    order: order++,
                })
            }

            if (row["Assign"] && row["Assign"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Assign",
                    description: row["Assign"],
                    order: order++,
                })
            }

            if (row["Keterangan"] && row["Keterangan"] !== "") {
                knwoledgeContentCreateManyInput.push({
                    id: ulid(),
                    knowledgeId: knowledgeId,
                    title: "Keterangan",
                    description: row["Keterangan"],
                    order: order++,
                })
            }
        }

        await KnowledgeRepository.createMany(knowledgeCreateManyInput)
        await KnowledgeRepository.createManyContent(knwoledgeContentCreateManyInput)

        const pubsub = GlobalPubSub.getInstance().getPubSub()

        for (const knowledge of knowledgeCreateManyInput) {
            const knowledgeWithUserKnowledgeAndKnowledgeAttachment =
                await KnowledgeRepository.getById(knowledge.id)

            await pubsub.sendToQueue(
                PUBSUB_TOPICS.KNOWLEDGE_CREATE,
                generateKnowledgeQueueDTO(knowledgeWithUserKnowledgeAndKnowledgeAttachment as any)
            )
        }

        return HandleServiceResponseSuccess({})
    } catch (error) {
        Logger.error(`KnowledgeService.bulkCreateTypeCase`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function archiveOrUnarchiveKnowledge(id: string) {
    try {
        const knowledge = await KnowledgeRepository.getById(id)

        if (!knowledge)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await KnowledgeRepository.archiveOrUnarchiveKnowledge(id, !knowledge.isArchived)
        return HandleServiceResponseSuccess({})
    } catch (error) {
        Logger.error(`KnowledgeService.archiveOrUnarchiveKnowledge`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
