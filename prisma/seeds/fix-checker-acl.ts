import { PrismaClient } from "../../generated/prisma/client"
import { seedAccessControlList } from "./seedAcl"

async function main() {
	const prisma = new PrismaClient()
	try {
		console.log("🚀 Starting targeted ACL fix...")
		await seedAccessControlList(prisma)
		console.log("✅ ACL fix completed successfully")
	} catch (e) {
		console.error(e)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

main()
