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
			data: {
				name: rest.name,
				description: rest.description,
				operationId: rest.operationId as string,
				tokenLimit: rest.tokenLimit ?? 0,
				id: ulid(),
			},
		})

		// Create default roles for the tenant
		const checkerRole = await tx.tenantRole.create({
			data: {
				id: ulid(),
				identifier: "CHECKER",
				name: "Checker",
				description: "Checker Role",
				level: 1,
				tenantId: tenant.id,
			},
		})

		await tx.tenantRole.create({
			data: {
				id: ulid(),
				identifier: "MAKER",
				name: "Maker",
				description: "Maker Role",
				level: 1,
				tenantId: tenant.id,
			},
		})

		await tx.tenantRole.create({
			data: {
				id: ulid(),
				identifier: "CONSUMER",
				name: "Consumer",
				description: "Consumer Role",
				level: 1,
				tenantId: tenant.id,
			},
		})

		// Assign CHECKER role to the head of tenant (admin)
		if (headOfTenantUserId) {
			await tx.tenantUser.create({
				data: {
					id: ulid(),
					tenantId: tenant.id,
					userId: headOfTenantUserId,
					tenantRoleId: checkerRole.id,
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
					identifier: {
						in: ["CHECKER", "HEAD_OF_OFFICE"],
					},
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
			(
				tenant.tenantUser.find(
					(tenantUser: any) => tenantUser.tenantRole.identifier === "CHECKER",
				) ||
				tenant.tenantUser.find(
					(tenantUser: any) =>
						tenantUser.tenantRole.identifier === "HEAD_OF_OFFICE",
				)
			)?.user ?? {},
			"password",
		),
		operation: tenant.operation,
		operationId: tenant.operationId,
		tenantUser: tenant.tenantUser,
		tokenLimit: tenant.tokenLimit,
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
			tenantRole:
				user.role === Roles.ADMIN
					? Roles.ADMIN
					: tenant.tenantUser[0].tenantRole,
			tokenLimit: tenant.tokenLimit,
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
			data: {
				name: rest.name,
				description: rest.description,
				operationId: rest.operationId,
				tokenLimit: rest.tokenLimit ?? 0,
			},
		})

		// Try to find the tenant specific CHECKER role
		let adminRole = await tx.tenantRole.findFirst({
			where: {
				identifier: "CHECKER",
				tenantId: id,
			},
		})

		// Fallback to legacy HEAD_OF_OFFICE role if CHECKER not found
		if (!adminRole) {
			adminRole = await tx.tenantRole.findFirst({
				where: {
					identifier: "HEAD_OF_OFFICE",
				},
			})
		}

		if (!adminRole) {
			// If neither exists, we can't assign an admin properly.
			// But creating one might be safer? For now, throw error as before.
			throw new Error("Admin role (CHECKER or HEAD_OF_OFFICE) not found")
		}

		// Remove existing admin users (checking both roles to be safe/thorough)
		await tx.tenantUser.deleteMany({
			where: {
				tenantId: id,
				tenantRole: {
					identifier: {
						in: ["CHECKER", "HEAD_OF_OFFICE"],
					},
				},
			},
		})

		if (headOfTenantUserId) {
			await tx.tenantUser.create({
				data: {
					id: ulid(),
					userId: headOfTenantUserId,
					tenantRoleId: adminRole.id, // Use the found role (CHECKER preferred)
					tenantId: id,
				},
			})
		}

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

// [BARU] Fungsi untuk menambahkan user ke tenant
export async function addTenantUser(
	tenantId: string,
	userId: string,
	tenantRoleId: string,
) {
	return await prisma.tenantUser.create({
		data: {
			id: ulid(),
			tenantId,
			userId,
			tenantRoleId,
		},
	})
}

export async function upsertSetting(
	tenantId: string,
	key: string,
	value: string,
) {
	return await prisma.tenantSetting.upsert({
		where: {
			tenantId_key: {
				tenantId,
				key,
			},
		},
		update: {
			value,
		},
		create: {
			id: ulid(),
			tenantId,
			key,
			value,
		},
	})
}

export async function getSetting(tenantId: string, key: string) {
	return await prisma.tenantSetting.findUnique({
		where: {
			tenantId_key: {
				tenantId,
				key,
			},
		},
	})
}

export async function getAllSettings(tenantId: string) {
	return await prisma.tenantSetting.findMany({
		where: {
			tenantId,
		},
	})
}
