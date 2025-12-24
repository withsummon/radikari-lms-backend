import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import { TenantUserUpdateDTO } from "$entities/TenantUser"
import Logger from "$pkg/logger"
import * as TenantRepository from "$repositories/TenantRepository"
import * as UserRepository from "$repositories/UserRepository"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"
import { Prisma, TenantUser } from "../../generated/prisma/client"
import { ulid } from "ulid"
import * as TenantUserRepository from "$repositories/TenantUserRepository"

export async function create(
	tenantId: string,
	data: TenantUserUpdateDTO,
): Promise<ServiceResponse<TenantUser | {}>> {
	try {
		const tenantUser = await TenantUserRepository.createTenantUser(
			tenantId,
			data,
		)
		return HandleServiceResponseSuccess(tenantUser)
	} catch (error) {
		Logger.error(`TenanUserService.create`, { error })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function assignUserTenantByTenantId(
	tenantId: string,
	data: TenantUserUpdateDTO[],
): Promise<ServiceResponse<{}>> {
	try {
		const tenant = await TenantRepository.getById(tenantId)

		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const tenantUserCreateManyInput: Prisma.TenantUserCreateManyInput[] = []

		for (const tenantUser of data) {
			const [user, tenantRole] = await Promise.all([
				UserRepository.getById(tenantUser.userId),
				TenantRoleRepository.getById(tenantUser.tenantRoleId),
			])

			if (!user || !tenantRole) continue

			tenantUserCreateManyInput.push({
				id: ulid(),
				userId: user.id,
				tenantId: tenant.id,
				tenantRoleId: tenantRole.id,
				headOfOperationUserId:
					!tenantUser.headOfOperationUserId ||
					tenantUser.headOfOperationUserId == ""
						? null
						: tenantUser.headOfOperationUserId,
				teamLeaderUserId:
					!tenantUser.teamLeaderUserId || tenantUser.teamLeaderUserId == ""
						? null
						: tenantUser.teamLeaderUserId,
				supervisorUserId:
					!tenantUser.supervisorUserId || tenantUser.supervisorUserId == ""
						? null
						: tenantUser.supervisorUserId,
				managerUserId:
					!tenantUser.managerUserId || tenantUser.managerUserId == ""
						? null
						: tenantUser.managerUserId,
			})
		}

		const tenantUsers = await TenantUserRepository.updateTenantUser(
			tenant.id,
			tenantUserCreateManyInput,
		)

		return HandleServiceResponseSuccess(tenantUsers)
	} catch (error) {
		Logger.error(`TenanUserService.assignUserTenantByTenantId`, {
			error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getByTenantId(
	tenantId: string,
): Promise<ServiceResponse<TenantUser[] | {}>> {
	try {
		const tenant = await TenantRepository.getById(tenantId)

		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const tenantUsers = await TenantUserRepository.getByTenantId(tenantId)

		return HandleServiceResponseSuccess(tenantUsers)
	} catch (error) {
		Logger.error(`TenanUserService.getByTenantId`, {
			error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: any,
): Promise<
	ServiceResponse<
		| {}
		| {
				content: { entries: TenantUser[]; totalData: number; totalPage: number }
		  }
	>
> {
	try {
		const { entries, count } = await TenantUserRepository.getAll(filters)

		const rows = filters.rows ? Number(filters.rows) : count
		// avoid division by zero if count is 0 and rows is 0 (though rows defaults to count if falsy)
		// actually if filters.rows is provided it's used. If not, we fetched all, so 1 page.
		// If count is 0, totalPage is 0.
		const totalPage = rows > 0 ? Math.ceil(count / rows) : 1

		return HandleServiceResponseSuccess({
			entries,
			totalData: count,
			totalPage,
		})
	} catch (error) {
		Logger.error(`TenanUserService.getAll`, {
			error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}
