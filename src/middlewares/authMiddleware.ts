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
import { prisma } from "$pkg/prisma"

/**
 * Helper: safely read tenantId param from different route styles.
 * Your project currently uses "/tenants/:id/..." in TenantRoutes,
 * while some middleware expects ":tenantId".
 */
function getTenantIdParam(c: Context): string | undefined {
	return (
		c.req.param("tenantId") ||
		c.req.param("id") ||
		c.req.param("tenant_id") ||
		undefined
	)
}

/**
 * Helper: normalize jwt payload to UserJWTDAO-like object.
 * The payload shape may differ depending on how you sign JWT.
 */
function getJwtUser(c: Context): UserJWTDAO | null {
	const payload = c.get("jwtPayload") as unknown

	if (!payload || typeof payload !== "object") return null

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const p = payload as any

	// common candidates
	const id: string | undefined = p.id ?? p.userId ?? p.sub
	const email: string | undefined = p.email
	const fullName: string | undefined = p.fullName ?? p.name
	const phoneNumber: string | undefined = p.phoneNumber ?? p.phone

	// normalize role
	const role = transformRoleToEnumRole(p.role) || Roles.USER

	if (!id || typeof id !== "string") return null

	return {
		id,
		email: email ?? "",
		fullName: fullName ?? "",
		phoneNumber: phoneNumber ?? "",
		role,
	}
}

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

		// decodedValue can be string | JwtPayload depending on how it was signed
		// store as-is, we'll normalize later in getJwtUser()
		c.set("jwtPayload", decodedValue)
	} catch (err) {
		console.log(err)
		return response_unauthorized(c, (err as Error).message)
	}

	await next()
}

export function checkRole(roles: Roles[]) {
	return async (c: Context, next: Next) => {
		try {
			const user = getJwtUser(c)
			const role = user?.role ?? Roles.USER

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
		try {
			const user = getJwtUser(c)
			if (!user) return response_unauthorized(c, "Invalid token payload")

			const tenantId = getTenantIdParam(c)
			if (!tenantId) {
				return response_forbidden(c, "Tenant id is missing on route parameter!")
			}

			const tenant = await TenantRepository.getById(tenantId)
			if (!tenant) {
				return response_forbidden(
					c,
					"You are not authorized to access this resource!",
				)
			}

			if (user.role === Roles.ADMIN) {
				await next()
				return
			}

			const tenantRoles = await TenantRoleRepository.getByUserId(user.id)

			if (!tenantRoles || tenantRoles.length === 0) {
				return response_forbidden(
					c,
					"You are not authorized to access this resource!",
				)
			}

			const hasAccess = tenantRoles.some((tr) =>
				tenantRoleIdentifiers.includes(tr.identifier),
			)

			if (!hasAccess) return response_forbidden(c, "Forbidden Action!")

			await next()
		} catch (err) {
			return response_internal_server_error(c, (err as Error).message)
		}
	}
}

export async function checkRoleInTenant(c: Context, next: Next) {
	try {
		const user = getJwtUser(c)
		if (!user) return response_unauthorized(c, "Invalid token payload")

		const tenantId = getTenantIdParam(c)
		if (!tenantId) {
			return response_forbidden(c, "Tenant id is missing on route parameter!")
		}

		if (user.role === Roles.ADMIN) {
			await next()
			return
		}

		const tenant = await TenantRepository.getById(tenantId)
		if (!tenant) {
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
	} catch (err) {
		return response_internal_server_error(c, (err as Error).message)
	}
}

export function checkAccessTenantRole(featureName: string, actionName: string) {
	return async (c: Context, next: Next) => {
		try {
			const user = getJwtUser(c)
			if (!user) return response_unauthorized(c, "Invalid token payload")

			const tenantId = getTenantIdParam(c)
			if (!tenantId) {
				return response_forbidden(c, "Tenant id is missing on route parameter!")
			}

			// ✅ Admin bypass (optional but usually expected)
			if (user.role === Roles.ADMIN) {
				await next()
				return
			}

			const userWithRoles = await prisma.user.findUnique({
				where: { id: user.id },
				include: {
					tenantUser: {
						where: { tenantId },
						include: { tenantRole: true },
					},
				},
			})

			if (!userWithRoles) {
				return response_forbidden(
					c,
					"You are not allowed to access this feature!",
				)
			}

			// If user isn't member of tenant, deny quickly
			if (!userWithRoles.tenantUser || userWithRoles.tenantUser.length === 0) {
				return response_forbidden(
					c,
					"You are not allowed to access this feature!",
				)
			}

			const tenantRoleIds = userWithRoles.tenantUser.map(
				(tu) => tu.tenantRoleId,
			)

			const acl = await prisma.accessControlList.findFirst({
				where: {
					featureName,
					actionName,
					tenantRoleId: { in: tenantRoleIds },
				},
				select: { id: true },
			})

			if (!acl) {
				return response_forbidden(
					c,
					"You are not allowed to access this feature!",
				)
			}

			await next()
		} catch (err) {
			return response_internal_server_error(c, (err as Error).message)
		}
	}
}
export function checkRoleOrSameUser(roles: Roles[]) {
	return async (c: Context, next: Next) => {
		try {
			const user = getJwtUser(c)
			if (!user) return response_unauthorized(c, "Invalid token payload")

			const targetUserId = c.req.param("id")

			if (roles.includes(user.role) || user.id === targetUserId) {
				await next()
			} else {
				return response_forbidden(c, "Forbidden Action!")
			}
		} catch (err) {
			return response_internal_server_error(c, (err as Error).message)
		}
	}
}
