import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import { ulid } from "ulid"
import { exclude, UserJWTDAO } from "$entities/User"
import { Roles } from "../../generated/prisma/client"

export async function create(data: TenantCreateUpdateDTO) {
	return await prisma.$transaction(async (tx) => {
		const { headOfTenantUserId, ...rest } = data
		const tenant = await tx.tenant.create({
			data: rest,
		})

		const headOfOfficeRole = await tx.tenantRole.findUnique({
			where: {
				identifier: "HEAD_OF_OFFICE",
			},
		})

		if (!headOfOfficeRole) {
			throw new Error("Head of Office role not found")
		}

		if (headOfTenantUserId) {
			await tx.tenantUser.create({
				data: {
					id: ulid(),
					tenantId: tenant.id,
					userId: headOfTenantUserId,
					tenantRoleId: headOfOfficeRole.id,
				},
			})
		}
		return tenant
	})
}

export async function getAll(filters: EzFilter.FilteringQuery) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	usedFilters.query.include = {
		tenantUser: {
			where: {
				tenantRole: {
					identifier: "HEAD_OF_OFFICE",
				},
			},
			include: {
				tenantRole: true,
				user: true,
			},
		},
	}

	const [tenant, totalData] = await Promise.all([
		prisma.tenant.findMany(usedFilters.query as any),
		prisma.tenant.count({
			where: usedFilters.query.where,
		}),
	])

	const tenantWithHeadOfOffice = tenant.map((tenant: any) => ({
		id: tenant.id,
		name: tenant.name,
		description: tenant.description,
		headOfOffice: exclude(
			tenant.tenantUser.find(
				(tenantUser: any) =>
					tenantUser.tenantRole.identifier === "HEAD_OF_OFFICE",
			)?.user ?? {},
			"password",
		),
		operation: tenant.operation,
	}))

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: tenantWithHeadOfOffice,
		totalData,
		totalPage,
	}
}

export async function getAllByUserId(
	filters: EzFilter.FilteringQuery,
	user: UserJWTDAO,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	if (user.role !== Roles.ADMIN) {
		usedFilters.query.where.AND.push({
			tenantUser: {
				some: {
					userId: user.id,
				},
			},
		})
	}

	usedFilters.query.include = {
		tenantUser: {
			where: {
				userId: user.id,
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

export async function update(id: string, data: TenantCreateUpdateDTO) {
	return await prisma.$transaction(async (tx) => {
		const { headOfTenantUserId, ...rest } = data
		const tenant = await tx.tenant.update({
			where: {
				id,
			},
			data: rest,
		})

		const headOfOfficeRole = await tx.tenantRole.findUnique({
			where: {
				identifier: "HEAD_OF_OFFICE",
			},
		})

		if (!headOfOfficeRole) {
			throw new Error("Head of Office role not found")
		}

		await tx.tenantUser.deleteMany({
			where: {
				tenantId: id,
				tenantRole: {
					identifier: "HEAD_OF_OFFICE",
				},
			},
		})

		await tx.tenantUser.create({
			data: {
				id: ulid(),
				userId: headOfTenantUserId,
				tenantRoleId: headOfOfficeRole.id,
				tenantId: id,
			},
		})

		return tenant
	})
}

export async function deleteById(id: string) {
	return await prisma.tenant.delete({
		where: {
			id,
		},
	})
}
