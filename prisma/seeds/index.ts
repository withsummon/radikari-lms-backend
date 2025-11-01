import { PrismaClient } from "../../generated/prisma/client"
import { seedAdmin } from "./seedAdmin"
import { seedTenant } from "./seedTenant"
import { seedMasterKnowledgeCategory } from "./seedMasterKnowledgeCategory"
import { seedMasterKnowledgeSubCategory } from "./seedMasterKnowledgeSubCategory"
import { seedMasterKnowledgeCase } from "./seedMasterKnowledgeCase"
import { seedKnowledge } from "./seedKnowledge"
import { seedOperation } from "./seedOperation"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function seed() {
    console.log("🚀 Starting seeder...")
    let prisma: PrismaClient | null = null

    try {
        prisma = new PrismaClient()
        try {
            await seedAdmin(prisma)
            await seedOperation(prisma)
            await seedTenant(prisma)
            await seedMasterKnowledgeCategory(prisma)
            await seedMasterKnowledgeSubCategory(prisma)
            await seedMasterKnowledgeCase(prisma)
            await seedKnowledge(prisma)
        } catch (seedError) {
            console.error("Seeding error:", seedError)
            throw seedError
        }
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

seed()
    .then(() => {
        console.log("✅ ALL SEEDING COMPLETED")
        process.exit(0)
    })
    .catch((error) => {
        console.error("❌ Seeding failed:", error)
        process.exit(1)
    })
