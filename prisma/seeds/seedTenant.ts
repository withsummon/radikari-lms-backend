import { PrismaClient, Roles } from "../../generated/prisma/client"
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

		console.log(`Tenant "${tenant.name}" created successfully`)
	} else {
		console.log("Tenant already exists, skipping")
	}
}

// Separate function to assign users to tenant after roles are created
export async function seedTenantUsers(prisma: PrismaClient) {
	console.log("🔧 Assigning users to tenant...")

	const tenant = await prisma.tenant.findFirst()
	if (!tenant) {
		console.log("❌ No tenant found, skipping user assignment")
		return
	}

	// Check if any tenant users already exist
	const existingTenantUsers = await prisma.tenantUser.count({
		where: { tenantId: tenant.id },
	})

	if (existingTenantUsers > 0) {
		console.log("✅ Tenant users already assigned, skipping")
		return
	}

	// Fetch roles for this tenant
	const headOfOfficeRole = await prisma.tenantRole.findFirst({
		where: { identifier: "HEAD_OF_OFFICE", tenantId: tenant.id },
	})

	const agentRole = await prisma.tenantRole.findFirst({
		where: { identifier: "AGENT", tenantId: tenant.id },
	})

	const adminUser = await prisma.user.findFirst({
		where: {
			role: Roles.ADMIN,
		},
	})

	const regularUser = await prisma.user.findFirst({
		where: {
			email: "user@test.com",
		},
	})

	// Add admin user with HEAD_OF_OFFICE role
	if (adminUser && headOfOfficeRole) {
		await prisma.tenantUser.create({
			data: {
				id: ulid(),
				userId: adminUser.id,
				tenantId: tenant.id,
				tenantRoleId: headOfOfficeRole.id,
			},
		})
		console.log(`  ✅ Admin user assigned as HEAD_OF_OFFICE`)
	} else {
		console.log(`  ❌ Could not assign admin: adminUser=${!!adminUser}, role=${!!headOfOfficeRole}`)
	}

	// Add regular user (user@test.com) with AGENT role
	if (regularUser && agentRole) {
		await prisma.tenantUser.create({
			data: {
				id: ulid(),
				userId: regularUser.id,
				tenantId: tenant.id,
				tenantRoleId: agentRole.id,
			},
		})
		console.log(`  ✅ Regular user assigned as AGENT`)
	} else {
		console.log(`  ❌ Could not assign regular user: user=${!!regularUser}, role=${!!agentRole}`)
	}
}
