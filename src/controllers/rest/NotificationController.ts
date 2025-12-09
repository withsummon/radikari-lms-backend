import { Context, TypedResponse } from "hono"
import * as NotificationService from "$services/NotificationService"
import {
    handleServiceErrorWithResponse,
    response_success,
} from "$utils/response.utils"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function getAll(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await NotificationService.getByUserId(user.id, filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all Notifications!")
}

export async function getUnreadCount(c: Context): Promise<TypedResponse> {
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await NotificationService.getUnreadCount(user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched unread count!")
}

export async function markAsRead(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await NotificationService.markAsRead(id, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully marked notification as read!")
}

export async function markAllAsRead(c: Context): Promise<TypedResponse> {
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await NotificationService.markAllAsRead(user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully marked all notifications as read!")
}

export async function deleteById(c: Context): Promise<TypedResponse> {
    const id = c.req.param("id")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await NotificationService.deleteById(id, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted notification!")
}

