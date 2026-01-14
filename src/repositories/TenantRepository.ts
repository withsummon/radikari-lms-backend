import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import { ulid } from "ulid"
import { exclude, UserJWTDAO } from "$entities/User"
import { Roles, Prisma } from "../../generated/prisma/client"

/**
 * Default role templates for new tenants
 * ACL Mapping:
 * - CHECKER = QUALITY_ASSURANCE (full admin access)
 * - MAKER = TRAINER (content creation)
 * - CONSUMER = AGENT (view-only)
 */
const DEFAULT_ROLE_TEMPLATES = [
	{
		identifier: "CHECKER",
		name: "Checker",
		description: "Tenant Admin with full access (Quality Assurance)",
		level: 5,
	},
	{
		identifier: "MAKER",
		name: "Maker",
		description: "Content creator and trainer role",
		level: 1,
	},
	{
		identifier: "CONSUMER",
		name: "Consumer",
		description: "View-only user role (Agent)",
		level: 1,
	},
]

const ROLE_ACL_PERMISSIONS: Record<
	string,
	Array<{ featureName: string; actions: string[] }>
> = {
	CHECKER: [
		{
			featureName: "USER_MANAGEMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "KNOWLEDGE",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"],
		},
		{
			featureName: "ASSIGNMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL"],
		},
		{
			featureName: "ANNOUNCEMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW", "UPDATE"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "BROADCAST", actions: ["CREATE", "VIEW", "UPDATE"] },
		{ featureName: "BULK_UPLOAD", actions: ["CREATE"] },
		{ featureName: "ACCESS_CONTROL_LIST", actions: ["VIEW", "UPDATE"] },
		{ featureName: "TENANT", actions: ["VIEW"] },
	],
	MAKER: [
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{
			featureName: "KNOWLEDGE",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"],
		},
		{
			featureName: "ASSIGNMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "APPROVAL"],
		},
		{
			featureName: "ANNOUNCEMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{ featureName: "USER_MANAGEMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["VIEW"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "BROADCAST", actions: ["CREATE", "VIEW", "UPDATE"] },
		{ featureName: "ACCESS_CONTROL_LIST", actions: ["VIEW", "UPDATE"] },
		{ featureName: "TENANT", actions: ["VIEW"] },
	],
	CONSUMER: [
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["VIEW"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "TENANT", actions: ["VIEW"] },
	],
}

export async function create(data: TenantCreateUpdateDTO) {
	return await prisma.$transaction(async (tx) => {
		const { headOfTenantUserId, ...rest } = data

		// 1. Create the tenant
		const tenant = await tx.tenant.create({
			data: {
				name: rest.name,
				description: rest.description,
				operationId: rest.operationId as string,
				tokenLimit: rest.tokenLimit ?? 0,
				id: ulid(),
			},
		})

		// 2. Create default roles for the new tenant
		const createdRoles: Record<string, { id: string }> = {}
		for (const roleTemplate of DEFAULT_ROLE_TEMPLATES) {
			const role = await tx.tenantRole.create({
				data: {
					id: ulid(),
					identifier: roleTemplate.identifier,
					name: roleTemplate.name,
					description: roleTemplate.description,
					level: roleTemplate.level,
					tenantId: tenant.id,
				},
			})
			createdRoles[roleTemplate.identifier] = role
		}

		// 3. Create ACL entries for each role
		// We need a user ID for createdById/updatedById - use headOfTenantUserId or find admin
		let aclCreatorId: string | undefined = headOfTenantUserId
		if (!aclCreatorId) {
			const admin = await tx.user.findFirst({ where: { role: "ADMIN" } })
			aclCreatorId = admin?.id
		}

		if (aclCreatorId) {
			const aclEntries: Prisma.AccessControlListCreateManyInput[] = []

			for (const [roleIdentifier, permissions] of Object.entries(
				ROLE_ACL_PERMISSIONS,
			)) {
				const role = createdRoles[roleIdentifier]
				if (!role) continue

				for (const perm of permissions) {
					for (const action of perm.actions) {
						aclEntries.push({
							id: ulid(),
							featureName: perm.featureName,
							actionName: action,
							tenantRoleId: role.id,
							createdById: aclCreatorId,
							updatedById: aclCreatorId,
						})
					}
				}
			}

			if (aclEntries.length > 0) {
				await tx.accessControlList.createMany({ data: aclEntries })
			}
		}

		const checkerRole = createdRoles["CHECKER"]
		if (headOfTenantUserId && checkerRole) {
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
	const { filters: rawFilters, ...rest } = filters
	const usedFilters = queryBuilder.build(rest as any)

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
	const { filters: rawFilters, ...rest } = filters
	const usedFilters = queryBuilder.build(rest as any)

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
				OR: [
					{ userId: user.id },
					{
						tenantRole: {
							identifier: { in: ["CHECKER", "HEAD_OF_OFFICE"] },
						},
					},
				],
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
					: tenant.tenantUser.find((tu: any) => tu.userId === user.id)
							?.tenantRole,
			headOfOffice: exclude(
				(
					tenant.tenantUser.find(
						(tu: any) => tu.tenantRole.identifier === "CHECKER",
					) ||
					tenant.tenantUser.find(
						(tu: any) => tu.tenantRole.identifier === "HEAD_OF_OFFICE",
					)
				)?.user ?? {},
				"password",
			),
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

		// Find the CHECKER role specific to this tenant
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
					tenantId: id,
				},
			})
		}

		if (!adminRole) {
			// If neither exists, we can't assign an admin properly.
			throw new Error(
				"Admin role (CHECKER or HEAD_OF_OFFICE) not found for this tenant",
			)
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
					tenantRoleId: adminRole.id,
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
