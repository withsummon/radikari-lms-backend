import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ServiceResponse,
} from "$entities/Service"
import { UserJWTDAO } from "$entities/User"
import Logger from "$pkg/logger"
import * as AccessControlListRepository from "$repositories/AccessControlListRepository"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { AccessControlList } from "../../generated/prisma/client"
import * as TenantUserRepository from "$repositories/TenantUserRepository"

export async function getAllFeatures(): Promise<ServiceResponse<any>> {
	try {
		const features = await AccessControlListRepository.findAllFeatures()
		return {
			status: true,
			data: features,
		}
	} catch (err) {
		Logger.error(`PrincipalAclService.getAllFeatures `, { error: err })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

type GetAllRoles = EzFilter.PaginatedResult<AccessControlList[]> | {}
export async function getAllRoles(
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<GetAllRoles>> {
	try {
		const result = await AccessControlListRepository.findAllRoles(filters)
		return HandleServiceResponseSuccess(result)
	} catch (err) {
		Logger.error(`PrincipalAclService.getAllRoles `, { error: err })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getEnabledFeaturesByRoleId(
	roleId: string,
	user: UserJWTDAO,
): Promise<ServiceResponse<Record<string, boolean> | {}>> {
	try {
		if (user.role === "ADMIN") {
			const features = await AccessControlListRepository.findFeatures()

			const enabledFeatures = features.reduce(
				(featureMap: Record<string, boolean>, mapping) => {
					const featureKey = `${mapping.featureName}.${mapping.actionName}`
					featureMap[featureKey] = true
					return featureMap
				},
				{},
			)

			return {
				status: true,
				data: {
					identifier: "ADMIN",
					name: "Admin",
					enabledFeatures,
				},
			}
		}

		const [roleDetails, featureMappings] =
			await AccessControlListRepository.findRoleWithFeatures(roleId)

		const enabledFeatures = featureMappings.reduce(
			(featureMap: Record<string, boolean>, mapping) => {
				const featureKey = `${mapping.featureName}.${mapping.actionName}`
				featureMap[featureKey] = true
				return featureMap
			},
			{},
		)

		return {
			status: true,
			data: {
				...roleDetails,
				enabledFeatures,
			},
		}
	} catch (err) {
		Logger.error(`PrincipalAclService.getEnabledFeaturesByRoleId `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function checkAccess(user: UserJWTDAO, feature: string) {
	try {
		const tenantUsers = await TenantUserRepository.getByUserId(user.id)

		let actions

		if (user.role === "ADMIN") {
			actions =
				await AccessControlListRepository.findActionsByFeatureName(feature)
		} else {
			actions =
				await AccessControlListRepository.findActionsByFeatureNameAndRoleId(
					feature,
					tenantUsers.map((tenantUser) => tenantUser.tenantRoleId),
				)
		}

		if (!actions) {
			return HandleServiceResponseCustomError("Forbidden access", 403)
		}

		return {
			status: true,
			data: {
				featureName: feature,
				actions,
			},
		}
	} catch (err) {
		Logger.error(`PrincipalAclService.checkAccess `, { error: err })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}
