import { PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

/**
 * DUAL ROLE SYSTEM DOCUMENTATION
 *
 * This project maintains TWO role systems for backward compatibility:
 *
 * 1. LEGACY ROLES (7 roles) - For existing/old tenants:
 *    - HEAD_OF_OFFICE (level 5) - Highest organizational role
 *    - OPS_MANAGER (level 4) - Operations manager
 *    - SUPERVISOR (level 3) - Supervisor role
 *    - TEAM_LEADER (level 2) - Team leader role
 *    - QUALITY_ASSURANCE (level 1) - QA specialist with full admin access
 *    - TRAINER (level 1) - Content creator and trainer
 *    - AGENT (level 1) - Basic user/agent
 *
 * 2. NEW SIMPLIFIED ROLES (3 roles) - For new tenant creation:
 *    - CHECKER (level 5) - Tenant admin, ACL equivalent to QUALITY_ASSURANCE
 *    - MAKER (level 1) - Content creator, ACL equivalent to TRAINER
 *    - CONSUMER (level 1) - View-only user, ACL equivalent to AGENT
 *
 * When creating new tenants, they receive CHECKER, MAKER, CONSUMER by default.
 * Old tenants continue using their legacy roles without disruption.
 *
 * ACL MAPPING:
 * - CHECKER ACL = QUALITY_ASSURANCE ACL (full admin access)
 * - MAKER ACL = TRAINER ACL (content creation & management)
 * - CONSUMER ACL = AGENT ACL (view-only access)
 */

const ROLE_TEMPLATES = [
	{
		identifier: "CHECKER",
		name: "Checker",
		description: "Tenant Admin with full access",
		level: 5,
	},
	{
		identifier: "HEAD_OF_OFFICE",
		name: "Head of Office",
		description: "Head of Office with highest level access",
		level: 5,
	},
	{
		identifier: "OPS_MANAGER",
		name: "Ops Manager",
		description: "Operations Manager",
		level: 4,
	},
	{
		identifier: "SUPERVISOR",
		name: "Supervisor",
		description: "Supervisor Role",
		level: 3,
	},
	{
		identifier: "TEAM_LEADER",
		name: "Team Leader",
		description: "Team Leader Role",
		level: 2,
	},
	{
		identifier: "QUALITY_ASSURANCE",
		name: "Quality Assurance",
		description: "QA Role with admin access",
		level: 1,
	},
	{
		identifier: "MAKER",
		name: "Maker",
		description: "Maker Role",
		level: 1,
	},
	{
		identifier: "CONSUMER",
		name: "Consumer",
		description: "Consumer Role",
		level: 1,
	},
	{
		identifier: "AGENT",
		name: "Agent",
		description: "Agent Role",
		level: 1,
	},
	{
		identifier: "TRAINER",
		name: "Trainer",
		description: "Trainer Role",
		level: 1,
	},
]

export async function seedGlobalRoles(prisma: PrismaClient) {
	console.log("🌱 Seeding roles for all tenants...")

	// Get all existing tenants
	const tenants = await prisma.tenant.findMany({
		select: { id: true, name: true },
	})

	if (tenants.length === 0) {
		console.log("⚠️ No tenants found, skipping role seeding")
		return
	}

	console.log(`📋 Found ${tenants.length} tenant(s)`)

	// For each tenant, create roles if they don't exist
	for (const tenant of tenants) {
		console.log(`  Creating roles for tenant: ${tenant.name}`)

		for (const roleTemplate of ROLE_TEMPLATES) {
			// Check if role already exists for this tenant
			const existingRole = await prisma.tenantRole.findFirst({
				where: {
					identifier: roleTemplate.identifier,
					tenantId: tenant.id,
				},
			})

			if (!existingRole) {
				await prisma.tenantRole.create({
					data: {
						id: ulid(),
						identifier: roleTemplate.identifier,
						name: roleTemplate.name,
						description: roleTemplate.description,
						level: roleTemplate.level,
						tenantId: tenant.id,
					},
				})
				console.log(`    ✅ Created role: ${roleTemplate.identifier}`)
			} else {
				console.log(`    ⏭️ Role exists: ${roleTemplate.identifier}`)
			}
		}
	}

	console.log("✨ Roles seeding completed!")
}
