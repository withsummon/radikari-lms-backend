import { PrismaClient } from "../generated/prisma/client"
import { seedTrainerAndQA } from "../prisma/seeds/seedTrainerAndQA"

async function runSeedTrainerAndQA() {
	console.log("🚀 Starting trainer and QA seeder...")
	let prisma: PrismaClient | null = null

	try {
		prisma = new PrismaClient()
		await seedTrainerAndQA(prisma)
	} catch (error) {
		console.error("❌ Fatal error:", error)
		if (error instanceof Error) {
			console.error("Stack:", error.stack)
		}
		throw error
	} finally {
		if (prisma) {
			console.log("Disconnecting prisma...")
			await prisma.$disconnect()
			console.log("👋 Database disconnected")
		}
	}
}

// Keep process alive until we explicitly exit
process.stdin.resume()

runSeedTrainerAndQA()
	.then(() => {
		console.log("✅ TRAINER AND QA SEEDING COMPLETED")
		process.exit(0)
	})
	.catch((error) => {
		console.error("❌ Seeding failed:", error)
		process.exit(1)
	})
