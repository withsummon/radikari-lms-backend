import { ulid } from "ulid"
import { PrismaClient } from "../../generated/prisma/client"

export async function seedMasterKnowledgeCase(prisma: PrismaClient) {
    const count = await prisma.masterKnowledgeCase.count()

    if (count == 0) {
        await prisma.masterKnowledgeCase.createMany({
            data: [
                {
                    id: ulid(),
                    name: "Double Payment",
                },
            ],
        })
    } else {
        console.log("Master knowledge case already seeded")
    }
}
