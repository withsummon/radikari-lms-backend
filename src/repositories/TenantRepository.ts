import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { TenantDTO } from "$entities/Tenant"

export async function create(data: TenantDTO) {
    return await prisma.tenant.create({
        data,
    })
}

export async function getAll(filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    const [tenant, totalData] = await Promise.all([
        prisma.tenant.findMany(usedFilters.query as any),
        prisma.tenant.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: tenant,
        totalData,
        totalPage,
    }
}

export async function getAllByUserId(filters: EzFilter.FilteringQuery, userId: string) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where.AND.push({
        tenantUser: {
            some: {
                userId,
            },
        },
    })

    usedFilters.query.include = {
        tenantUser: {
            where: {
                userId,
            },
            select: {
                tenantRole: true,
            },
        },
    }

    const [tenant, totalData] = await Promise.all([
        prisma.tenant.findMany(usedFilters.query as any),
        prisma.tenant.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: tenant.map((tenant: any) => ({
            id: tenant.id,
            name: tenant.name,
            description: tenant.description,
            tenantRole: tenant.tenantUser[0].tenantRole,
        })),
        totalData,
        totalPage,
    }
}

export async function getById(id: string) {
    return await prisma.tenant.findUnique({
        where: {
            id,
        },
        include: {
            operation: true,
        },
    })
}

export async function getByName(name: string) {
    return await prisma.tenant.findFirst({
        where: {
            name,
        },
    })
}

export async function update(id: string, data: TenantDTO) {
    return await prisma.tenant.update({
        where: {
            id,
        },
        data,
    })
}

export async function deleteById(id: string) {
    return await prisma.tenant.delete({
        where: {
            id,
        },
    })
}
