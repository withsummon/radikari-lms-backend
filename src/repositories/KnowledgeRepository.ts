import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { KnowledgeContentDTO, KnowledgeDTO } from "$entities/Knowledge"
import { KnowledgeActivityLogAction, KnowledgeStatus, Prisma } from "../../generated/prisma/client"
import { ulid } from "ulid"
import * as TenantRoleHelpers from "./helpers/TenantRoleHelpers"
import { UserJWTDAO } from "$entities/User"

export async function create(userId: string, tenantId: string, data: KnowledgeDTO) {
    return await prisma.$transaction(async (tx) => {
        const { attachments, contents, ...rest } = data

        // Create knowledge
        const knowledge = await tx.knowledge.create({
            data: {
                ...rest,
                tenantId,
                createdByUserId: userId,
                knowledgeAttachment: {
                    createMany: {
                        data: attachments.map((attachment) => ({
                            id: ulid(),
                            attachmentUrl: attachment.attachmentUrl,
                        })),
                    },
                },
            },
        })

        // Create knowledge contents and their attachments
        await createContent(tx, knowledge.id, contents)

        // Create activity log
        await tx.knowledgeActivityLog.create({
            data: {
                id: ulid(),
                knowledgeId: knowledge.id,
                action: KnowledgeActivityLogAction.CREATE,
                createdByUserId: userId,
            },
        })

        return knowledge
    })
}

export async function getAll(user: UserJWTDAO, tenantId: string, filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    let usedFilters = queryBuilder.build(filters)
    usedFilters = await TenantRoleHelpers.buildFilterTenantRole(usedFilters, user, tenantId)

    usedFilters.query.include = {
        createdByUser: {
            select: {
                id: true,
                fullName: true,
            },
        },
    }

    const [knowledge, totalData] = await Promise.all([
        prisma.knowledge.findMany(usedFilters.query as any),
        prisma.knowledge.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: knowledge,
        totalData,
        totalPage,
    }
}

export async function getByIdAndTenantId(id: string, tenantId: string) {
    return await prisma.knowledge.findUnique({
        where: {
            id,
            tenantId,
        },
        relationLoadStrategy: "join",
        include: {
            knowledgeAttachment: true,
            knowledgeContent: {
                include: {
                    knowledgeContentAttachment: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
                orderBy: {
                    order: "asc",
                },
            },
            knowledgeActivityLog: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            createdByUser: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    })
}

export async function update(id: string, data: KnowledgeDTO) {
    return await prisma.$transaction(async (tx) => {
        const { attachments, contents, ...rest } = data

        // Update knowledge
        const knowledge = await tx.knowledge.update({
            where: { id },
            data: { ...rest },
        })

        // Delete old attachments and contents (cascade will delete content attachments)
        await tx.knowledgeAttachment.deleteMany({
            where: { knowledgeId: id },
        })
        await tx.knowledgeContent.deleteMany({
            where: { knowledgeId: id },
        })

        // Recreate knowledge attachments
        if (attachments.length > 0) {
            await tx.knowledgeAttachment.createMany({
                data: attachments.map((attachment) => ({
                    id: ulid(),
                    knowledgeId: knowledge.id,
                    attachmentUrl: attachment.attachmentUrl,
                })),
            })
        }

        // Recreate knowledge contents and their attachments
        await createContent(tx, knowledge.id, contents)
        return knowledge
    })
}

export async function deleteById(id: string) {
    return await prisma.knowledge.delete({
        where: {
            id,
        },
    })
}

export async function updateStatus(
    id: string,
    userId: string,
    status: KnowledgeStatus,
    action: KnowledgeActivityLogAction
) {
    return await prisma.$transaction(async (tx) => {
        const knowledge = await tx.knowledge.update({
            where: { id },
            data: { status },
        })

        await tx.knowledgeActivityLog.create({
            data: {
                id: ulid(),
                knowledgeId: id,
                action,
                createdByUserId: userId,
            },
        })

        return knowledge
    })
}

export async function createContent(
    tx: Prisma.TransactionClient,
    knowledgeId: string,
    contents: KnowledgeContentDTO[]
) {
    const knowledgeContentCreateManyInput: Prisma.KnowledgeContentCreateManyInput[] = []
    const knowledgeContentAttachmentCreateManyInput: Prisma.KnowledgeContentAttachmentCreateManyInput[] =
        []
    // Create knowledge contents and their attachments
    for (const content of contents) {
        const contentId = ulid()

        knowledgeContentCreateManyInput.push({
            id: contentId,
            knowledgeId: knowledgeId,
            title: content.title,
            description: content.description,
            order: content.order,
        })

        // Create content attachments if exists
        if (content.attachments.length > 0) {
            knowledgeContentAttachmentCreateManyInput.push(
                ...content.attachments.map((attachment) => ({
                    id: ulid(),
                    knowledgeContentId: contentId,
                    order: attachment.order,
                    attachmentUrl: attachment.attachmentUrl,
                }))
            )
        }
    }

    await tx.knowledgeContent.createMany({
        data: knowledgeContentCreateManyInput,
    })

    await tx.knowledgeContentAttachment.createMany({
        data: knowledgeContentAttachmentCreateManyInput,
    })
}
