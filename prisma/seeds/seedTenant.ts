import { PrismaClient, Roles } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedTenant(prisma: PrismaClient) {
	console.log("Starting seedTenant function...")
	const countTenant = await prisma.tenant.count()

	if (countTenant === 0) {
		const operation = await prisma.operation.findFirst()
		if (!operation) {
			console.log("No operation found. Please seed operation first.")
			return
		}

		const tenant = await prisma.tenant.create({
			data: {
				id: ulid(),
				name: "BABAE INC",
				description: "BABAE INC - Indonesia",
				operationId: operation.id,
			},
		})

		// Fetch existing global roles
		const headOfOfficeRole = await prisma.tenantRole.findFirst({
			where: { identifier: "HEAD_OF_OFFICE", tenantId: tenant.id },
		})

		const agentRole = await prisma.tenantRole.findFirst({
			where: { identifier: "AGENT", tenantId: tenant.id },
		})

		const adminUser = await prisma.user.findFirst({
			where: { role: Roles.ADMIN },
		})

		const regularUser = await prisma.user.findFirst({
			where: { email: "user@test.com" },
		})

		// Add admin user with HEAD_OF_OFFICE role
		if (adminUser && headOfOfficeRole) {
			await prisma.tenantUser.upsert({
				where: {
					userId_tenantId: {
						userId: adminUser.id,
						tenantId: tenant.id,
					},
				},
				update: {
					tenantRoleId: headOfOfficeRole.id,
				},
				create: {
					id: ulid(),
					userId: adminUser.id,
					tenantId: tenant.id,
					tenantRoleId: headOfOfficeRole.id,
				},
			})
		}

		// Add regular user (user@test.com) with AGENT role
		if (regularUser && agentRole) {
			await prisma.tenantUser.upsert({
				where: {
					userId_tenantId: {
						userId: regularUser.id,
						tenantId: tenant.id,
					},
				},
				update: {
					tenantRoleId: agentRole.id,
				},
				create: {
					id: ulid(),
					userId: regularUser.id,
					tenantId: tenant.id,
					tenantRoleId: agentRole.id,
				},
			})
		}
	} else {
		console.log("✅ Tenant already exists, ensuring associations...")
		const firstTenant = await prisma.tenant.findFirst()
		if (firstTenant) {
			const headOfOfficeRole = await prisma.tenantRole.findFirst({
				where: { identifier: "HEAD_OF_OFFICE", tenantId: firstTenant.id },
			})

			const adminUser = await prisma.user.findFirst({
				where: { role: Roles.ADMIN },
			})

			if (adminUser && headOfOfficeRole) {
				await prisma.tenantUser.upsert({
					where: {
						userId_tenantId: {
							userId: adminUser.id,
							tenantId: firstTenant.id,
						},
					},
					update: {
						tenantRoleId: headOfOfficeRole.id,
					},
					create: {
						id: ulid(),
						userId: adminUser.id,
						tenantId: firstTenant.id,
						tenantRoleId: headOfOfficeRole.id,
					},
				})
			}
		}
	}
}
