import { Prisma, PrismaClient, Roles } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedTenant(prisma: PrismaClient) {
	const countTenant = await prisma.tenant.count()

	if (countTenant == 0) {
		const operation = await prisma.operation.findFirst()

		const tenant = await prisma.tenant.create({
			data: {
				id: ulid(),
				name: "BABAE INC",
				description: "BABAE INC - Indonesia",
				operationId: operation!.id,
			},
		})

		// Fetch existing global roles instead of creating new ones
		const headOfOfficeRole = await prisma.tenantRole.findFirst({
			where: { identifier: "HEAD_OF_OFFICE" },
		})

		const user = await prisma.user.findFirst({
			where: {
				role: Roles.ADMIN,
			},
		})

		if (user && headOfOfficeRole) {
			await prisma.tenantUser.create({
				data: {
					id: ulid(),
					userId: user.id,
					tenantId: tenant.id,
					tenantRoleId: headOfOfficeRole.id,
				},
			})
		}
	}
}
