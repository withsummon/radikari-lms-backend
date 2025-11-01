import { PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedMasterKnowledgeSubCategory(prisma: PrismaClient) {
    const count = await prisma.masterKnowledgeSubCategory.count()

    if (count == 0) {
        await prisma.masterKnowledgeSubCategory.createMany({
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
            ],
        })

        console.log("Master knowledge sub category seeded successfully")
    } else {
        console.log("Master knowledge sub category already seeded")
    }
}
