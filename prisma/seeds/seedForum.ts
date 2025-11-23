import { ulid } from "ulid"
import { PrismaClient, Roles } from "../../generated/prisma/client"

export async function seedForum(prisma: PrismaClient) {
    const count = await prisma.forum.count()

    if (count == 0) {
        const [tenant, user] = await Promise.all([
            prisma.tenant.findFirst(),
            prisma.user.findFirst({
                where: {
                    role: Roles.ADMIN,
                },
            }),
        ])

        if (tenant) {
            const forum = await prisma.forum.create({
                data: {
                    id: ulid(),
                    title: "Forum 1",
                    content: "Forum 1 content",
                    tenantId: tenant.id,
                    createdByUserId: user!.id,
                },
            })

            await prisma.forumAttachment.create({
                data: {
                    id: ulid(),
                    forumId: forum.id,
                    attachmentUrl: "https://example.com/attachment1.jpg",
                },
            })
        }
    }
}
