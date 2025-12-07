import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"

export async function create(userId: string, action: string) {
    return await prisma.userActivityLog.create({
        data: {
            id: ulid(),
            userId,
            action,
        },
    })
}

export async function getAll(filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.include = {
        user: {
            select: {
                id: true,
                fullName: true,
            },
        },
    }

    usedFilters.query.orderBy = {
        createdAt: "desc",
    }

    const [userActivityLog, totalData] = await Promise.all([
        prisma.userActivityLog.findMany(usedFilters.query as any),
        prisma.userActivityLog.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: userActivityLog,
        totalData,
        totalPage,
    }
}

export async function getById(id: string) {
    return await prisma.userActivityLog.findUnique({
        where: {
            id,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    })
}

export async function deleteById(id: string) {
    return await prisma.userActivityLog.delete({
        where: {
            id,
        },
    })
}
