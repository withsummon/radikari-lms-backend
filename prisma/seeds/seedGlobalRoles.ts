import { PrismaClient, Roles } from "../../generated/prisma/client"
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

export async function seedGlobalRoles(prisma: PrismaClient) {
	console.log("🌱 Seeding global roles...")

	const globalRoles = [
		{
			id: ulid(),
			identifier: "CHECKER",
			name: "Checker",
			description: "Tenant Admin with full access",
			level: 5,
		},
		{
			id: ulid(),
			identifier: "HEAD_OF_OFFICE",
			name: "Head of Office",
			description: "Head of Office with highest level access",
			level: 5,
		},
		{
			id: ulid(),
			identifier: "OPS_MANAGER",
			name: "Ops Manager",
			description: "Operations Manager",
			level: 4,
		},
		{
			id: ulid(),
			identifier: "SUPERVISOR",
			name: "Supervisor",
			description: "Supervisor Role",
			level: 3,
		},
		{
			id: ulid(),
			identifier: "TEAM_LEADER",
			name: "Team Leader",
			description: "Team Leader Role",
			level: 2,
		},
		{
			id: ulid(),
			identifier: "QUALITY_ASSURANCE",
			name: "Quality Assurance",
			description: "QA Role with admin access",
			level: 1,
		},
		{
			id: ulid(),
			identifier: "MAKER",
			name: "Maker",
			description: "Maker Role",
			level: 1,
		},
		{
			id: ulid(),
			identifier: "CONSUMER",
			name: "Consumer",
			description: "Consumer Role",
			level: 1,
		},
		{
			id: ulid(),
			identifier: "AGENT",
			name: "Agent",
			description: "Agent Role",
			level: 1,
		},
		{
			id: ulid(),
			identifier: "TRAINER",
			name: "Trainer",
			description: "Trainer Role",
			level: 1,
		},
	]

	// Use createMany with skipDuplicates to handle upsert behavior
	await prisma.tenantRole.createMany({
		data: globalRoles,
		skipDuplicates: true,
	})

	console.log("✨ Global roles seeding completed!")
}
