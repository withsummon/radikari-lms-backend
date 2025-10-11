import { Prisma, PrismaClient, Roles } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedTenant(prisma: PrismaClient) {
    const countTenant = await prisma.tenant.count()

    if (countTenant == 0) {
        const tenant = await prisma.tenant.create({
            data: {
                id: ulid(),
                name: "BABAE INC",
                description: "BABAE INC - Indonesia",
            },
        })

        const tenantRoleCreateManyInput: Prisma.TenantRoleCreateManyInput[] = [
            {
                id: ulid(),
                identifier: "HEAD_OF_OFFICE",
                name: "Head of Office",
                description: "Head of Office",
                level: 1,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "OPS_MANAGER",
                name: "Ops Manager",
                description: "Ops Manager",
                level: 2,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "SUPPORT_MANAGER",
                name: "Support Manager",
                description: "Support Manager",
                level: 2,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "SUPERVISOR",
                name: "Supervisor",
                description: "Supervisor",
                level: 3,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "SUPPORT_SUPERVISOR",
                name: "Support Supervisor",
                description: "Support Supervisor",
                level: 3,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "TEAM_LEADER",
                name: "Team Leader",
                description: "Team Leader",
                level: 4,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "TRAINER",
                name: "Trainer",
                description: "Trainer",
                level: 4,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "QUALITY_ASSURANCE",
                name: "Quality Assurance",
                description: "Quality Assurance",
                level: 4,
                tenantId: tenant.id,
            },
            {
                id: ulid(),
                identifier: "AGENT",
                name: "Agent",
                description: "Agent",
                level: 5,
                tenantId: tenant.id,
            },
        ]
        await prisma.tenantRole.createMany({
            data: tenantRoleCreateManyInput,
        })

        const user = await prisma.user.findFirst({
            where: {
                role: Roles.ADMIN,
            },
        })

        if (user) {
            await prisma.tenantUser.create({
                data: {
                    id: ulid(),
                    userId: user.id,
                    tenantId: tenant.id,
                    tenantRoleId: tenantRoleCreateManyInput.find(
                        (role) => role.identifier === "HEAD_OF_OFFICE"
                    )?.id!,
                },
            })
        }
    }
}
