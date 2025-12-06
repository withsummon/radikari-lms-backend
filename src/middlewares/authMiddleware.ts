import {
	response_forbidden,
	response_internal_server_error,
	response_unauthorized,
} from "$utils/response.utils"
import { transformRoleToEnumRole } from "$utils/user.utils"
import { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import jwt from "jsonwebtoken"
import { Roles } from "../../generated/prisma/client"
import { UserJWTDAO } from "$entities/User"
import * as TenantUserRepository from "$repositories/TenantUserRepository"
import * as TenantRepository from "$repositories/TenantRepository"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"

export async function checkJwt(c: Context, next: Next) {
	let token: string | undefined
	const authHeader = c.req.header("Authorization")

	if (authHeader) {
		const parts = authHeader.split(" ")
		if (parts.length === 2 && parts[0] === "Bearer") {
			token = parts[1]
		}
	}

	if (!token) {
		const cookie = getCookie(c, "radikari-session")
		if (cookie) {
			try {
				const session = JSON.parse(cookie)
				token = session.accessToken
			} catch (error) {
				console.error("Failed to parse radikari-session cookie:", error)
			}
		}
	}

	if (!token) {
		return response_unauthorized(c, "Token should be provided")
	}

	try {
		const decodedValue = jwt.verify(token, process.env.JWT_SECRET ?? "")
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

export function checkRoleAssignmentAccess(tenantRoleIdentifiers: string[]) {
	return async (c: Context, next: Next) => {
		const user: UserJWTDAO = c.get("jwtPayload")
		const tenantId = c.req.param("tenantId")

		const tenant = await TenantRepository.getById(tenantId)
		if (!tenant || tenant === null) {
			return response_forbidden(
				c,
				"You are not authorized to access this resource!",
			)
		}

		if (user.role == Roles.ADMIN) {
			await next()
		} else {
			const tenantRoles = await TenantRoleRepository.getByUserId(
				user.id,
				tenantId,
			)
			if (!tenantRoles || tenantRoles.length === 0) {
				return response_forbidden(
					c,
					"You are not authorized to access this resource!",
				)
			}

			if (
				!tenantRoles.some((tenantRole) =>
					tenantRoleIdentifiers.includes(tenantRole.identifier),
				)
			) {
				return response_forbidden(c, "Forbidden Action!")
			}
			await next()
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
			return response_forbidden(
				c,
				"You are not authorized to access this resource!",
			)
		}

		const tenantUser = await TenantUserRepository.getByTenantIdAndUserId(
			tenantId,
			user.id,
		)
		if (!tenantUser) {
			return response_forbidden(
				c,
				"You are not authorized to access this resource!",
			)
		}
		await next()
	}
}
