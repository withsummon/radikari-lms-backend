import { PrismaClient } from "../generated/prisma/client"
import { ulid } from "ulid"

const prisma = new PrismaClient()

async function main() {
	console.log("🚀 Starting CONSUMER ACL fix script...")

	const adminUser = await prisma.user.findFirst({
		where: { role: "ADMIN" },
	})

	if (!adminUser) {
		console.error("❌ Admin user not found. Cannot proceed.")
		return
	}

	// Find all consumer roles across all tenants
	const consumerRoles = await prisma.tenantRole.findMany({
		where: { identifier: "CONSUMER" },
	})

	console.log(`🔍 Found ${consumerRoles.length} CONSUMER roles.`)

	const requiredPermissions = [
		{ featureName: "TENANT", actionName: "VIEW" },
	]

	const unauthorizedPermissions = [
		{ featureName: "TENANT", actionName: "CREATE" },
		{ featureName: "TENANT", actionName: "UPDATE" },
		{ featureName: "TENANT", actionName: "DELETE" },
	]

	let fixCount = 0
	let cleanupCount = 0

	for (const role of consumerRoles) {
		// 1. Add required permissions
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

		// 2. Cleanup unauthorized permissions
		for (const perm of unauthorizedPermissions) {
			const deleted = await prisma.accessControlList.deleteMany({
				where: {
					featureName: perm.featureName,
					actionName: perm.actionName,
					tenantRoleId: role.id,
				},
			})
			if (deleted.count > 0) {
				console.log(
					`🗑️ Removed unauthorized ${perm.featureName}.${perm.actionName} from role ${role.name} (${role.tenantId})`,
				)
				cleanupCount += deleted.count
			}
		}
	}

	console.log(
		`\n✨ Finished! Fixed ${fixCount} missing and cleaned up ${cleanupCount} unauthorized permissions.`,
	)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
