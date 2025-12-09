import { UserActivityLog } from "../../generated/prisma/client"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as UserActivityLogRepository from "$repositories/UserActivityLogRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as TenantRepository from "$repositories/TenantRepository"

export async function getAll(
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<UserActivityLog[]> | {}>> {
	try {
		const data = await UserActivityLogRepository.getAll(filters)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`UserActivityLogService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<UserActivityLog | {}>> {
	try {
		let userActivityLog = await UserActivityLogRepository.getById(id)

		if (!userActivityLog)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(userActivityLog)
	} catch (err) {
		Logger.error(`UserActivityLogService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function create(
	userId: string,
	action: string,
	tenantId: string,
	additionalInformation?: string,
) {
	try {
		let generatedAction = action

		const tenant = await TenantRepository.getById(tenantId)

		if (tenant) {
			generatedAction += ` di tenant ${tenant.name}`
		}

		if (additionalInformation) {
			generatedAction += ` ${additionalInformation}`
		}

		await UserActivityLogRepository.create(userId, generatedAction)
	} catch (err) {
		Logger.error(`UserActivityLogService.generateUserActivityLog`, {
			error: err,
		})
	}
}
