import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AiChatRoomDTO } from "$entities/AiChatRoom"

export async function create(data: AiChatRoomDTO) {
    return await prisma.aiChatRoom.create({
        data,
    })
}

export async function getAll(filters: EzFilter.FilteringQuery, userId: string, tenantId: string) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where.AND.push({
        userId,
        tenantId,
    })

    const [aiChatRoom, totalData] = await Promise.all([
        prisma.aiChatRoom.findMany(usedFilters.query as any),
        prisma.aiChatRoom.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: aiChatRoom,
        totalData,
        totalPage,
    }
}

export async function getByIdAndUserId(id: string, userId: string) {
    return await prisma.aiChatRoom.findUnique({
        where: {
            id,
            userId,
        },
        include: {
            tenant: true,
        },
    })
}

export async function update(id: string, data: AiChatRoomDTO) {
    return await prisma.aiChatRoom.update({
        where: {
            id,
        },
        data: {
            title: data.title,
        },
    })
}

export async function deleteById(id: string) {
    return await prisma.aiChatRoom.delete({
        where: {
            id,
        },
    })
}
