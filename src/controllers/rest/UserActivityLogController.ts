import { Context, TypedResponse } from "hono"
import * as UserActivityLogService from "$services/UserActivityLogService"
import { handleServiceErrorWithResponse, response_success } from "$utils/response.utils"
import * as EzFilter from "@nodewave/prisma-ezfilter"

export async function getAll(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const serviceResponse = await UserActivityLogService.getAll(filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all UserActivityLog!")
}

export async function getById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")

    const serviceResponse = await UserActivityLogService.getById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched UserActivityLog by id!")
}
