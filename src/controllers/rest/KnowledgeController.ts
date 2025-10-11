import { Context, TypedResponse } from "hono"
import * as KnowledgeService from "$services/KnowledgeService"
import {
    handleServiceErrorWithResponse,
    response_created,
    response_success,
} from "$utils/response.utils"
import { KnowledgeApprovalDTO, KnowledgeDTO } from "$entities/Knowledge"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function create(c: Context): Promise<TypedResponse> {
    const data: KnowledgeDTO = await c.req.json()
    const user: UserJWTDAO = c.get("jwtPayload")
    const tenantId = c.req.param("tenantId")

    const serviceResponse = await KnowledgeService.create(user.id, tenantId, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_created(c, serviceResponse.data, "Successfully created new Knowledge!")
}

export async function getAll(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const tenantId = c.req.param("tenantId")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await KnowledgeService.getAll(user, tenantId, filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all Knowledge!")
}

export async function getById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const tenantId = c.req.param("tenantId")

    const serviceResponse = await KnowledgeService.getById(id, tenantId)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched Knowledge by id!")
}

export async function update(c: Context): Promise<TypedResponse> {
    const data: KnowledgeDTO = await c.req.json()
    const id = c.req.param("id")
    const tenantId = c.req.param("tenantId")

    const serviceResponse = await KnowledgeService.update(id, tenantId, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated Knowledge!")
}

export async function deleteById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const tenantId = c.req.param("tenantId")

    const serviceResponse = await KnowledgeService.deleteById(id, tenantId)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted Knowledge!")
}

export async function approveById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const tenantId = c.req.param("tenantId")
    const user: UserJWTDAO = c.get("jwtPayload")
    const data: KnowledgeApprovalDTO = await c.req.json()

    const serviceResponse = await KnowledgeService.approveById(id, tenantId, user.id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully approved Knowledge!")
}
