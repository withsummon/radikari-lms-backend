import { Context, TypedResponse } from "hono"
import * as AccessControlListService from "$services/AccessListControlListService"
import {
    handleServiceErrorWithResponse,
    response_bad_request,
    response_success,
} from "$utils/response.utils"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function getEnabledFeaturesByTenantRoleId(c: Context): Promise<TypedResponse> {
    const id = c.req.param("tenantRoleId")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await AccessControlListService.getEnabledFeaturesByRoleId(id, user)
    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(
        c,
        serviceResponse.data,
        "Successfully fetch enabled features by role id"
    )
}

export async function getAllFeatures(c: Context): Promise<TypedResponse> {
    const serviceResponse = await AccessControlListService.getAllFeatures()
    if (!serviceResponse.status) return handleServiceErrorWithResponse(c, serviceResponse)

    return response_success(c, serviceResponse.data, "Successfully fetch all features")
}

export async function getAllRoles(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())

    const serviceResponse = await AccessControlListService.getAllRoles(filters)

    if (!serviceResponse.status) return handleServiceErrorWithResponse(c, serviceResponse)

    return response_success(c, serviceResponse.data, "Successfully fetched Tenant Role(s)")
}

export async function checkAccess(c: Context): Promise<TypedResponse> {
    const user: UserJWTDAO = c.get("jwtPayload")
    const feature = c.req.query("feature")

    if (!feature) {
        return response_bad_request(c, "feature is required")
    }

    const serviceResponse = await AccessControlListService.checkAccess(user, feature as string)
    if (!serviceResponse.status) return handleServiceErrorWithResponse(c, serviceResponse)

    return response_success(c, serviceResponse.data, "Successfully checked access to feature")
}
