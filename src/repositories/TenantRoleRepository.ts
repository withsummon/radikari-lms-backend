import { prisma } from "$pkg/prisma"
import { Prisma } from "../../generated/prisma/client"

export async function createMany(data: Prisma.TenantRoleCreateManyInput[]) {
	return await prisma.tenantRole.createMany({
		data,
	})
}

export async function getAll() {
	return await prisma.tenantRole.findMany()
}

export async function getById(id: string) {
	return await prisma.tenantRole.findUnique({
		where: {
			id,
		},
	})
}

export async function getByUserId(userId: string, tenantId: string) {
	return await prisma.tenantRole.findMany({
		where: {
			tenantUser: {
				some: {
					userId,
					tenantId,
				},
			},
		},
	})
}
