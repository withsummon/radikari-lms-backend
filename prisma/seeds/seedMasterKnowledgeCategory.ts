import { ulid } from "ulid"
import { PrismaClient } from "../../generated/prisma/client"

export async function seedMasterKnowledgeCategory(prisma: PrismaClient) {
    const count = await prisma.masterKnowledgeCategory.count()

    if (count === 0) {
        await prisma.masterKnowledgeCategory.createMany({
            data: [
                {
                    id: ulid(),
                    name: "Matrix",
                },
                {
                    id: ulid(),
                    name: "Modul",
                },
                {
                    id: ulid(),
                    name: "Product Knowledge",
                },
                {
                    id: ulid(),
                    name: "Promo",
                },
                {
                    id: ulid(),
                    name: "Procedure",
                },
                {
                    id: ulid(),
                    name: "Video Tutorial",
                },
            ],
        })
        console.log("Master knowledge category seeded successfully")
    } else {
        console.log("Master knowledge category already seeded")
    }
}
