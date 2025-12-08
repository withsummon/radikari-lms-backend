import { Context, TypedResponse } from "hono"
import * as TenantService from "$services/TenantService"
import {
    handleServiceErrorWithResponse,
    response_created,
    response_success,
} from "$utils/response.utils"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { TenantUserUpdateDTO } from "$entities/TenantUser"
import * as TenanUserService from "$services/TenanUserService"
import { UserJWTDAO } from "$entities/User"
import * as TenantRoleService from "$services/TenantRoleService"

export async function create(c: Context): Promise<TypedResponse> {
    const data: TenantCreateUpdateDTO = await c.req.json()
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await TenantService.create(data, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_created(c, serviceResponse.data, "Successfully created new Tenant!")
}

export async function getAll(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const serviceResponse = await TenantService.getAll(filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all Tenant!")
}

export async function getById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")

    const serviceResponse = await TenantService.getById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched Tenant by id!")
}

export async function update(c: Context): Promise<TypedResponse> {
    const data: TenantCreateUpdateDTO = await c.req.json()
    const id = c.req.param("id")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await TenantService.update(id, data, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated Tenant!")
}

export async function deleteById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const user: UserJWTDAO = c.get("jwtPayload")
    const serviceResponse = await TenantService.deleteById(id, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted Tenant!")
}

export async function getUserInTenant(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")

    const serviceResponse = await TenanUserService.getByTenantId(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched users in tenant!")
}

export async function assignUserToTenant(c: Context): Promise<TypedResponse> {
    const data: TenantUserUpdateDTO[] = await c.req.json()
    const id = c.req.param("id")

    const serviceResponse = await TenanUserService.assignUserTenantByTenantId(id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully assigned user to tenant!")
}

export async function getAllByUser(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await TenantService.getAllByUserId(filters, user)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all tenants by user id!")
}

export async function getAllRoles(c: Context): Promise<TypedResponse> {
    const serviceResponse = await TenantRoleService.getAll()

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all roles!")
}

export async function createTenantUser(c: Context): Promise<TypedResponse> {
    const data: TenantUserUpdateDTO = await c.req.json()
    const id = c.req.param("id")

    const serviceResponse = await TenanUserService.create(id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully created tenant user!")
}
