import { PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedOperation(prisma: PrismaClient) {
    const count = await prisma.operation.count()

    if (count == 0) {
        const user = await prisma.user.findFirst({
            where: {
                role: "USER",
            },
        })
        if (!user) {
            console.log("User not found. Please seed user first.")
            return
        }
        await prisma.operation.create({
            data: {
                id: ulid(),
                name: "Operation 1",
                description: "Operation 1",
                headOfOperationUserId: user!.id,
            },
        })

        console.log("Operation seeded successfully")
    } else {
        console.log("Operation already seeded")
    }
}
