import { PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedBroadcast(prisma: PrismaClient) {
    const count = await prisma.broadcast.count()
    if (count == 0) {
        const tenants = await prisma.tenant.findMany()

        for (const tenant of tenants) {
            await prisma.broadcast.create({
                data: {
                    id: ulid(),
                    tenantId: tenant.id,
                    content: "Hello, this is a broadcast message",
                },
            })
        }
    }
}
