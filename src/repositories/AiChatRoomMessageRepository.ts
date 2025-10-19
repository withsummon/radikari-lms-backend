import { AiChatRoomMessageDTO } from "$entities/AiChatRoomMessage"
import { prisma } from "$pkg/prisma"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { Prisma } from "../../generated/prisma/client"

export async function create(data: AiChatRoomMessageDTO, tx?: Prisma.TransactionClient) {
    console.log(data)
    const prismaClient = tx || prisma
    return await prismaClient.aiChatRoomMessage.create({
        data,
    })
}

export async function getAll(filters: EzFilter.FilteringQuery, aiChatRoomId: string) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where.AND.push({
        aiChatRoomId,
    })

    usedFilters.query.include = {
        knowledge: true,
    }

    usedFilters.query.orderBy = {
        createdAt: "desc",
    }

    const [aiChatRoomMessage, totalData] = await Promise.all([
        prisma.aiChatRoomMessage.findMany(usedFilters.query as any),
        prisma.aiChatRoomMessage.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: aiChatRoomMessage,
        totalData,
        totalPage,
    }
}

export async function getById(id: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || prisma
    return await prismaClient.aiChatRoomMessage.findUnique({
        where: {
            id,
        },
    })
}
