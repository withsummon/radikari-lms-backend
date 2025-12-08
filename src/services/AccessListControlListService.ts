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
import { AccessControlListDTO } from "$entities/AccessControlList"
import { ulid } from "ulid"
import { TenantRoleDTO } from "$entities/TenantRole"

export async function createRole(
    data: TenantRoleDTO
): Promise<ServiceResponse<AccessControlList | {}>> {
    try {
        const createdData = await AccessControlListRepository.createRole(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`AccessListControlListService.createRole `, { error: err })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function updateRoleAccess(
    tenantRoleId: string,
    data: AccessControlListDTO,
    userId: string
) {
    try {
        const enabledFeatureKeys = Object.keys(data.enabledFeatures)
        const createMappings: any[] = []
        const deleteMappings: any[] = []

        console.log("enabledFeatureKeys", enabledFeatureKeys)

        for (const enabledFeature of enabledFeatureKeys) {
            const [featureName, actionName] = enabledFeature.split(".")

            console.log("featureName", featureName)
            console.log("actionName", actionName)
            // Using repository layer to verify feature-action existence
            const actionExists = await AccessControlListRepository.findActionByFeatureAndName(
                featureName,
                actionName
            )

            console.log("actionExists", actionExists)

            // Only proceed if the action exists for this feature
            if (actionExists) {
                console.log("tenantRoleId", tenantRoleId)
                const existingMapping = await AccessControlListRepository.findAccessMapping(
                    tenantRoleId,
                    featureName,
                    actionName
                )

                console.log("existingMapping", existingMapping)

                if (data.enabledFeatures[enabledFeature] === false && existingMapping) {
                    deleteMappings.push({ featureName, actionName, tenantRoleId })
                }

                if (data.enabledFeatures[enabledFeature] === true && !existingMapping) {
                    createMappings.push({
                        id: ulid(),
                        featureName,
                        actionName,
                        tenantRoleId,
                        createdById: userId,
                        updatedById: userId,
                    })
                }
            }
        }

        console.log("createMappings", createMappings)
        console.log("deleteMappings", deleteMappings)

        await AccessControlListRepository.updateRoleAccess(createMappings, deleteMappings)

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`AccessListControlListService.updateRoleAccess `, { error: err })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAllFeatures(): Promise<ServiceResponse<any>> {
    try {
        const features = await AccessControlListRepository.findAllFeatures()
        return {
            status: true,
            data: features,
        }
    } catch (err) {
        Logger.error(`AccessListControlListService.getAllFeatures `, { error: err })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

type GetAllRoles = EzFilter.PaginatedResult<AccessControlList[]> | {}
export async function getAllRoles(
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<GetAllRoles>> {
    try {
        const result = await AccessControlListRepository.findAllRoles(filters)
        return HandleServiceResponseSuccess(result)
    } catch (err) {
        Logger.error(`AccessListControlListService.getAllRoles `, { error: err })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getEnabledFeaturesByRoleId(
    roleId: string
): Promise<ServiceResponse<Record<string, boolean> | {}>> {
    try {
        const [roleDetails, featureMappings] =
            await AccessControlListRepository.findRoleWithFeatures(roleId)

        const enabledFeatures = featureMappings.reduce(
            (featureMap: Record<string, boolean>, mapping) => {
                const featureKey = `${mapping.featureName}.${mapping.actionName}`
                featureMap[featureKey] = true
                return featureMap
            },
            {}
        )

        return {
            status: true,
            data: {
                ...roleDetails,
                enabledFeatures,
            },
        }
    } catch (err) {
        Logger.error(`AccessListControlListService.getEnabledFeaturesByRoleId `, {
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
            actions = await AccessControlListRepository.findActionsByFeatureName(feature)
        } else {
            actions = await AccessControlListRepository.findActionsByFeatureNameAndRoleId(
                feature,
                tenantUsers.map((tenantUser) => tenantUser.tenantRoleId)
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
        Logger.error(`AccessListControlListService.checkAccess `, { error: err })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
