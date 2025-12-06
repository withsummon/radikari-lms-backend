import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AnnouncementCreateDTO } from "$entities/Announcement"
import { ulid } from "ulid"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function create(data: AnnouncementCreateDTO) {
	const { tenantRoleIds, ...rest } = data
	return await prisma.announcement.create({
		data: {
			...rest,
			announcementTenantRoleAccesses: {
				createMany: {
					data: tenantRoleIds.map((tenantRoleId) => ({
						id: ulid(),
						tenantRoleId,
					})),
				},
			},
		},
	})
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
	userId: string,
	tenantId: string,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const tenantRoles = await TenantRoleRepository.getByUserId(userId, tenantId)

	usedFilters.query.where.AND.push({
		tenantId,
	})

	usedFilters.query.where.AND.push({
		OR: [
			{
				createdByUserId: userId,
			},
			{
				announcementTenantRoleAccesses: {
					some: {
						tenantRoleId: {
							in: tenantRoles.map((tenantRole) => tenantRole.id),
						},
					},
				},
			},
		],
	})

	usedFilters.query.include = {
		createdByUser: {
			select: {
				id: true,
				fullName: true,
			},
		},
		announcementTenantRoleAccesses: {
			include: {
				tenantRole: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		},
	}

	const [announcement, totalData] = await Promise.all([
		prisma.announcement.findMany(usedFilters.query as any),
		prisma.announcement.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: announcement,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.announcement.findUnique({
		where: {
			id,
		},
		include: {
			createdByUser: {
				select: {
					id: true,
					fullName: true,
				},
			},
			announcementTenantRoleAccesses: {
				include: {
					tenantRole: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		relationLoadStrategy: "join",
	})
}

export async function update(id: string, data: AnnouncementCreateDTO) {
	return await prisma.$transaction(async (tx) => {
		const { tenantRoleIds, ...rest } = data
		const announcement = await tx.announcement.update({
			where: {
				id,
			},
			data: {
				...rest,
			},
		})

		await tx.announcementTenantRoleAccess.deleteMany({
			where: {
				announcementId: id,
			},
		})

		await tx.announcementTenantRoleAccess.createMany({
			data: [
				...tenantRoleIds.map((tenantRoleId) => ({
					id: ulid(),
					tenantRoleId,
					announcementId: id,
				})),
			],
		})
		return announcement
	})
}

export async function deleteById(id: string) {
	return await prisma.announcement.delete({
		where: {
			id,
		},
	})
}
