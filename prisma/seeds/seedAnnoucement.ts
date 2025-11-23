import { ulid } from "ulid"
import { PrismaClient, Roles } from "../../generated/prisma/client"

export async function seedAnnouncement(prisma: PrismaClient) {
    const count = await prisma.announcement.count()

    if (count == 0) {
        const [tenant, tenantRoles, adminUser] = await Promise.all([
            prisma.tenant.findFirst(),
            prisma.tenantRole.findMany(),
            prisma.user.findFirst({
                where: {
                    role: Roles.ADMIN,
                },
            }),
        ])

        if (tenant) {
            await prisma.announcement.create({
                data: {
                    id: ulid(),
                    title: "Announcement 1",
                    content: "Announcement 1 content",
                    tenantId: tenant.id,
                    createdByUserId: adminUser!.id,
                    announcementTenantRoleAccesses: {
                        createMany: {
                            data: tenantRoles.map((role) => ({
                                id: ulid(),
                                tenantRoleId: role.id,
                            })),
                        },
                    },
                },
            })
            console.log("Announcement created")
        }
    }
}
