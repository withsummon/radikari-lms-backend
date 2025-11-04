import {
    response_forbidden,
    response_internal_server_error,
    response_unauthorized,
} from "$utils/response.utils"
import { transformRoleToEnumRole } from "$utils/user.utils"
import { Context, Next } from "hono"
import jwt from "jsonwebtoken"
import { Roles } from "../../generated/prisma/client"
import { UserJWTDAO } from "$entities/User"
import * as TenantUserRepository from "$repositories/TenantUserRepository"
import * as TenantRepository from "$repositories/TenantRepository"

export async function checkJwt(c: Context, next: Next) {
    const token = c.req.header("Authorization")?.split(" ")[1]
    const JWT_SECRET = process.env.JWT_SECRET ?? ""
    if (!token) {
        return response_unauthorized(c, "Token should be provided")
    }

    try {
        const decodedValue = jwt.verify(token, JWT_SECRET)
        c.set("jwtPayload", decodedValue)
    } catch (err) {
        console.log(err)
        return response_unauthorized(c, (err as Error).message)
    }
    await next()
}

export function checkRole(roles: Roles[]) {
    return async (c: Context, next: Next) => {
        const role = transformRoleToEnumRole(c.get("jwtPayload").role)
        try {
            if (roles.includes(role)) {
                await next()
            } else {
                return response_forbidden(c, "Forbidden Action!")
            }
        } catch (err) {
            return response_internal_server_error(c, (err as Error).message)
        }
    }
}

export async function checkRoleInTenant(c: Context, next: Next) {
    const tenantId = c.req.param("tenantId")
    const user: UserJWTDAO = c.get("jwtPayload")

    if (user.role == Roles.ADMIN) {
        await next()
    } else {
        const tenant = await TenantRepository.getById(tenantId)
        if (!tenant || tenant === null) {
            return response_forbidden(c, "You are not authorized to access this resource!")
        }

        const tenantUser = await TenantUserRepository.getByTenantIdAndUserId(tenantId, user.id)
        if (!tenantUser) {
            return response_forbidden(c, "You are not authorized to access this resource!")
        }
        await next()
    }
}
