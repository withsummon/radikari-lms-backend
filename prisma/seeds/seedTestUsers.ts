import { ulid } from "ulid"
import { PrismaClient, Roles } from "../../generated/prisma/client"

export async function seedTestUsers(prisma: PrismaClient) {
	console.log("Starting seedTestUsers function...")

	const hashedPassword = await Bun.password.hash("user1234", "argon2id")

	// Cleanup existing TenantUser associations for these test users
	await prisma.tenantUser.deleteMany({
		where: {
			user: {
				email: {
					startsWith: "testuser",
					endsWith: "@example.com",
				}
			}
		}
	})

	for (let i = 1; i <= 80; i++) {
		const email = `testuser${i}@example.com`
		
		await prisma.user.upsert({
			where: { email },
			update: {
				password: hashedPassword,
				role: Roles.USER,
			},
			create: {
				id: ulid(),
				fullName: `Test User ${i}`,
				password: hashedPassword,
				email: email,
				role: Roles.USER,
				phoneNumber: `081234567${i.toString().padStart(3, '0')}`,
			},
		})
	}

	console.log("seedTestUsers function completed successfully")
}
