import { PrismaClient } from "../generated/prisma/client"
import { ulid } from "ulid"

const prisma = new PrismaClient()

async function main() {
	console.log("🚀 Starting CHECKER ACL fix script...")

	const adminUser = await prisma.user.findFirst({
		where: { role: "ADMIN" },
	})

	if (!adminUser) {
		console.error("❌ Admin user not found. Cannot proceed.")
		return
	}

	// Find all checker roles across all tenants
	const checkerRoles = await prisma.tenantRole.findMany({
		where: { identifier: "CHECKER" },
	})

	console.log(`🔍 Found ${checkerRoles.length} CHECKER roles.`)

	const requiredPermissions = [
		{ featureName: "KNOWLEDGE", actionName: "APPROVAL" },
		{ featureName: "KNOWLEDGE", actionName: "ARCHIVE" },
		{ featureName: "ASSIGNMENT", actionName: "APPROVAL" },
	]

	let fixCount = 0

	for (const role of checkerRoles) {
		for (const perm of requiredPermissions) {
			const existing = await prisma.accessControlList.findUnique({
				where: {
					featureName_actionName_tenantRoleId: {
						featureName: perm.featureName,
						actionName: perm.actionName,
						tenantRoleId: role.id,
					},
				},
			})

			if (!existing) {
				await prisma.accessControlList.create({
					data: {
						id: ulid(),
						featureName: perm.featureName,
						actionName: perm.actionName,
						tenantRoleId: role.id,
						createdById: adminUser.id,
						updatedById: adminUser.id,
					},
				})
				console.log(
					`✅ Added ${perm.featureName}.${perm.actionName} to role ${role.name} (${role.tenantId})`,
				)
				fixCount++
			}
		}
	}

	console.log(`\n✨ Finished! Fixed ${fixCount} missing permissions.`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
