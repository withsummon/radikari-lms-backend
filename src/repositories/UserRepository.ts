import { CreateUserDTO } from "$entities/UserManagement"
import { exclude, UpdateUserDTO } from "$entities/User"
import { prisma } from "$pkg/prisma"
import * as EzFilter from "@nodewave/prisma-ezfilter"

export async function create(data: CreateUserDTO) {
    return await prisma.user.create({
        data,
    })
}

export async function getById(id: string) {
    return await prisma.user.findUnique({
        where: {
            id,
        },
    })
}

export async function update(id: string, data: UpdateUserDTO) {
    return await prisma.user.update({
        where: {
            id,
        },
        data,
    })
}

export async function deleteById(id: string) {
    return await prisma.user.delete({
        where: {
            id,
        },
    })
}

export async function getAll(filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    const [user, totalData] = await Promise.all([
        prisma.user.findMany(usedFilters.query as any),
        prisma.user.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: user.map((user) => exclude(user, "password")),
        totalData,
        totalPage,
    }
}

export async function getByEmail(email: string) {
    return await prisma.user.findUnique({
        where: {
            email,
        },
    })
}

export async function updatePassword(id: string, password: string) {
    return await prisma.user.update({
        where: {
            id,
        },
        data: {
            password,
        },
    })
}
