import { TenantUserUpdateDTO } from "$entities/TenantUser"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { Prisma } from "../../generated/prisma/client"

export async function updateTenantUser(
	tenantId: string,
	data: Prisma.TenantUserCreateManyInput[],
) {
	return prisma.$transaction(async (tx) => {
		await tx.tenantUser.deleteMany({
			where: {
				tenantId,
			},
		})
		return await tx.tenantUser.createMany({
			data,
		})
	})
}

export async function createTenantUser(
	tenantId: string,
	data: TenantUserUpdateDTO,
) {
	return prisma.tenantUser.create({
		data: {
			id: ulid(),
			tenantId,
			userId: data.userId,
			tenantRoleId: data.tenantRoleId,
			headOfOperationUserId: data.headOfOperationUserId,
			teamLeaderUserId: data.teamLeaderUserId,
			supervisorUserId: data.supervisorUserId,
			managerUserId: data.managerUserId,
		},
	})
}

export async function getByTenantId(tenantId: string) {
	return await prisma.tenantUser.findMany({
		where: {
			tenantId,
		},
		include: {
			user: {
				select: {
					id: true,
					fullName: true,
					email: true,
					phoneNumber: true,
				},
			},
			tenantRole: true,
			headOfOperation: {
				select: {
					id: true,
					fullName: true,
					email: true,
					phoneNumber: true,
				},
			},
			teamLeader: {
				select: {
					id: true,
					fullName: true,
					email: true,
					phoneNumber: true,
				},
			},
			supervisor: {
				select: {
					id: true,
					fullName: true,
					email: true,
					phoneNumber: true,
				},
			},
			manager: {
				select: {
					id: true,
					fullName: true,
					email: true,
					phoneNumber: true,
				},
			},
		},
	})
}

export async function getByTenantIdAndUserId(tenantId: string, userId: string) {
	return await prisma.tenantUser.findUnique({
		where: {
			userId_tenantId: {
				userId,
				tenantId,
			},
		},
		include: {
			tenantRole: true,
		},
	})
}

export async function getByUserId(userId: string) {
	return await prisma.tenantUser.findMany({
		where: {
			userId,
		},
		include: {
			tenantRole: true,
		},
	})
}

export async function getByTenantRoleId(tenantRoleId: string) {
	return await prisma.tenantUser.findMany({
		where: {
			tenantRoleId,
		},
	})
}

export async function getAll(filters: any) {
    const { page, rows, orderKey, orderRule } = filters;
    
    // Determine skip and take: prefer explicit page/rows, fallback to filters.skip/take (from EzFilter)
    let skip: number | undefined;
    let take: number | undefined;

    if (page && rows) {
        skip = (Number(page) - 1) * Number(rows);
        take = Number(rows);
    } else {
        skip = filters.skip;
        take = filters.take;
    }

    // Determine orderBy
    let orderBy: any = undefined;
    if (orderKey && orderRule) {
        if (orderKey.includes('.')) {
            const parts = orderKey.split('.');
            let current: Record<string, any> = orderBy = {};
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = {};
                current = current[parts[i]] as Record<string, any>;
            }
            current[parts[parts.length - 1]] = orderRule;
        } else {
            orderBy = { [orderKey]: orderRule };
        }
    } else if (filters.orderBy) {
        orderBy = filters.orderBy;
    }
    // Unflatten helper
    const unflatten = (obj: Record<string, any>) => {
        const result: Record<string, any> = {};
        for (const key in obj) {
            const parts = key.split('.');
            let current: Record<string, any> = result;
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = current[parts[i]] || {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = obj[key];
        }
        return result;
    }

    // Initialize where object
    let where: any = {};

    // Handle searchFilters
    if (filters.searchFilters) {
        let parsedSearchFilters: Record<string, any> = {};
        if (typeof filters.searchFilters === 'string') {
             try {
                 parsedSearchFilters = JSON.parse(filters.searchFilters);
             } catch (e) { /* ignore */ }
        } else if (typeof filters.searchFilters === 'object') {
             parsedSearchFilters = filters.searchFilters;
        }

        const keys = Object.keys(parsedSearchFilters);
        if (keys.length > 0) {
             const orConditions: any[] = [];
             
             for (const key of keys) {
                 const value = parsedSearchFilters[key];
                 // Construct { key: { contains: value, mode: 'insensitive' } } then unflatten
                 // Note: unflatten expects path "user.fullName" -> value.
                 // We want "user.fullName" -> { contains: value, mode: 'insensitive' }
                 
                 const condition = unflatten({
                     [key]: { contains: value, mode: 'insensitive' }
                 });
                 orConditions.push(condition);
             }

             // Use AND to combine with existing where, but OR inside for the search keys
             if (!where.AND) {
                 where.AND = [];
             }
             if (!Array.isArray(where.AND)) {
                 where.AND = [where.AND];
             }
             where.AND.push({ OR: orConditions });
        }
    }

    const [entries, count] = await prisma.$transaction([
        prisma.tenantUser.findMany({
            where,
            ...(typeof skip !== 'undefined' && { skip }),
            ...(typeof take !== 'undefined' && { take }),
            ...(orderBy && { orderBy }),
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                tenantRole: true,
            },
        }),
        prisma.tenantUser.count({
            where,
        }),
    ]);

    return { entries, count };
}
