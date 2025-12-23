import { PrismaClient, Roles } from "../../generated/prisma/client"
import { ulid } from "ulid"

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
