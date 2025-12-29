import { ulid } from "ulid"
import { PrismaClient, Roles } from "../../generated/prisma/client"

export async function seedTrainerAndQA(prisma: PrismaClient) {
	console.log("Starting seedTrainerAndQA function...")

	// Get the first tenant
	const tenant = await prisma.tenant.findFirst()
	if (!tenant) {
		console.log("No tenant found. Please seed tenant first.")
		return
	}

	// Get trainer and quality assurance tenant roles
	const trainerRole = await prisma.tenantRole.findFirst({
		where: {
			identifier: "TRAINER",
		},
	})

	const qualityAssuranceRole = await prisma.tenantRole.findFirst({
		where: {
			identifier: "QUALITY_ASSURANCE",
		},
	})

	if (!trainerRole) {
		console.log(
			"Trainer tenant role not found. Please seed tenant roles first.",
		)
		return
	}

	if (!qualityAssuranceRole) {
		console.log(
			"Quality Assurance tenant role not found. Please seed tenant roles first.",
		)
		return
	}

	// Check trainer count
	let countTrainer = 0
	try {
		console.log("Counting trainer users...")
		countTrainer = await prisma.user.count({
			where: {
				role: "USER",
				tenantUser: {
					some: {
						tenantRoleId: trainerRole.id,
					},
				},
			},
		})
		console.log("Trainer count:", countTrainer)
	} catch (error) {
		console.error("Failed to count trainer users:", error)
		throw error
	}

	// Check quality assurance count
	let countQualityAssurance = 0
	try {
		console.log("Counting quality assurance users...")
		countQualityAssurance = await prisma.user.count({
			where: {
				role: "USER",
				tenantUser: {
					some: {
						tenantRoleId: qualityAssuranceRole.id,
					},
				},
			},
		})
		console.log("Quality Assurance count:", countQualityAssurance)
	} catch (error) {
		console.error("Failed to count quality assurance users:", error)
		throw error
	}

	// Create trainer if needed
	if (countTrainer === 0) {
		try {
			const hashedPassword = await Bun.password.hash("trainer1234", "argon2id")
			console.log("Creating trainer user...")

			const trainerUser = await prisma.user.create({
				data: {
					id: ulid(),
					fullName: "Trainer",
					password: hashedPassword,
					email: "trainer2@test.com",
					role: Roles.USER,
					phoneNumber: "08224567891",
				},
			})

			// Create tenant user association for trainer
			await prisma.tenantUser.create({
				data: {
					id: ulid(),
					userId: trainerUser.id,
					tenantId: tenant.id,
					tenantRoleId: trainerRole.id,
				},
			})

			console.log("Trainer user created successfully")
		} catch (error) {
			console.error("Failed to create trainer user:", error)
			throw error
		}
	}

	// Create quality assurance if needed
	if (countQualityAssurance === 0) {
		try {
			const hashedPassword = await Bun.password.hash("qa1234", "argon2id")
			console.log("Creating quality assurance user...")

			const qaUser = await prisma.user.create({
				data: {
					id: ulid(),
					fullName: "Quality Assurance",
					password: hashedPassword,
					email: "qa2@test.com",
					role: Roles.USER,
					phoneNumber: "08224567892",
				},
			})

			// Create tenant user association for quality assurance
			await prisma.tenantUser.create({
				data: {
					id: ulid(),
					userId: qaUser.id,
					tenantId: tenant.id,
					tenantRoleId: qualityAssuranceRole.id,
				},
			})

			console.log("Quality Assurance user created successfully")
		} catch (error) {
			console.error("Failed to create quality assurance user:", error)
			throw error
		}
	}

	console.log("seedTrainerAndQA function completed successfully")
}
