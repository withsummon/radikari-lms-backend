import { UserJWTDAO } from "$entities/User"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"
import { Roles } from "../../../generated/prisma/client"
import { TenantRoleIdentifier } from "$entities/TenantRole"

export async function generatedFilterForAssignment(
	usedFilters: EzFilter.BuildQueryResult,
	user: UserJWTDAO,
	tenantId: string,
) {
	if (user.role == Roles.ADMIN) {
		return usedFilters
	}

	const tenantRoles = await TenantRoleRepository.getByUserId(user.id)

	if (
		tenantRoles.find(
			(tenantRole) =>
				tenantRole.identifier == TenantRoleIdentifier.QUALITY_ASSURANCE ||
				tenantRole.identifier == TenantRoleIdentifier.TRAINER ||
				tenantRole.identifier == TenantRoleIdentifier.MAKER ||
				tenantRole.identifier == TenantRoleIdentifier.CHECKER,
		)
	) {
		return usedFilters
	}

	usedFilters.query.where.AND.push({
		status: "PUBLISHED",
		OR: [
			{
				assignmentTenantRoleAccesses: {
					some: {
						tenantRoleId: {
							in: tenantRoles.map((tenantRole) => tenantRole.id),
						},
					},
				},
			},
			{
				assignmentUserAccesses: {
					some: {
						userId: user.id,
					},
				},
			},
		],
	})

	return usedFilters
}
