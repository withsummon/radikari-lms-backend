import { Context } from "hono"
import { prisma } from "$pkg/prisma"
import {
	response_bad_request,
	response_not_found,
	response_success,
	response_forbidden,
	response_internal_server_error,
} from "$utils/response.utils"
import { Roles } from "../../generated/prisma/client"
import { UserJWTDAO } from "$entities/User"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"

type CreateUserInTenantDTO = {
	fullName: string
	email: string
	phoneNumber: string
	password: string
	tenantRoleId: string
}

type UpdateUserInTenantDTO = {
	fullName?: string
	email?: string
	phoneNumber?: string
	password?: string
}

const userSelect = {
	id: true,
	fullName: true,
	email: true,
	phoneNumber: true,
	profilePictureUrl: true,
	role: true,
	type: true,
	createdAt: true,
	updatedAt: true,
	lastLoginAt: true,
}

function prismaToHttpError(c: Context, err: unknown) {
	// Prisma unique constraint error
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const e = err as any
	if (e?.code === "P2002") {
		return response_bad_request(c, "Bad Request", [
			{ field: "email", message: "email already used" },
		])
	}
	return response_internal_server_error(c, (err as Error).message)
}

// GET /tenants/:id/users/manage
export async function getAllByTenant(c: Context) {
	try {
		const tenantId = c.req.param("id")

		const rows = await prisma.tenantUser.findMany({
			where: { tenantId },
			include: {
				user: { select: userSelect },
				tenantRole: true,
			},
			orderBy: { user: { fullName: "asc" } },
		})

		return response_success(c, rows, "OK")
	} catch (err) {
		return prismaToHttpError(c, err)
	}
}

// GET /tenants/:id/users/manage/:userId
export async function getByUserIdInTenant(c: Context) {
	try {
		const tenantId = c.req.param("id")
		const userId = c.req.param("userId")

		const row = await prisma.tenantUser.findUnique({
			where: { userId_tenantId: { userId, tenantId } },
			include: {
				user: { select: userSelect },
				tenantRole: true,
			},
		})

		if (!row) return response_not_found(c)
		return response_success(c, row, "OK")
	} catch (err) {
		return prismaToHttpError(c, err)
	}
}

// POST /tenants/:id/users/manage
// create user + assign to tenant
export async function createAndAssignToTenant(c: Context) {
	try {
		const tenantId = c.req.param("id")
		const data = await c.req.json<CreateUserInTenantDTO>()

		if (!data?.tenantRoleId) {
			return response_bad_request(c, "Bad Request", [
				{ field: "tenantRoleId", message: "tenantRoleId is required" },
			])
		}

		const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
		if (!tenant) return response_bad_request(c, "Tenant not found")

		const role = await prisma.tenantRole.findUnique({
			where: { id: data.tenantRoleId },
		})
		if (!role) {
			return response_bad_request(c, "Bad Request", [
				{ field: "tenantRoleId", message: "tenant role not found" },
			])
		}

		const userId = randomUUID()
		const hashed =
			data.password && data.password.trim().length > 0
				? await bcrypt.hash(data.password, 10)
				: ""

		const result = await prisma.$transaction(async (tx) => {
			const createdUser = await tx.user.create({
				data: {
					id: userId,
					fullName: data.fullName,
					email: data.email,
					phoneNumber: data.phoneNumber,
					password: hashed,
				},
				select: userSelect,
			})

			const tenantUser = await tx.tenantUser.create({
				data: {
					id: randomUUID(),
					tenantId,
					userId: createdUser.id,
					tenantRoleId: data.tenantRoleId,
				},
				include: {
					user: { select: userSelect },
					tenantRole: true,
				},
			})

			return tenantUser
		})

		return response_success(c, result, "User created & assigned")
	} catch (err) {
		return prismaToHttpError(c, err)
	}
}

// PUT /tenants/:id/users/manage/:userId
export async function updateUserInTenant(c: Context) {
	try {
		const tenantId = c.req.param("id")
		const userId = c.req.param("userId")
		const jwtUser: UserJWTDAO = c.get("jwtPayload")

		const membership = await prisma.tenantUser.findUnique({
			where: { userId_tenantId: { userId, tenantId } },
			include: { user: true },
		})
		if (!membership) return response_not_found(c)

		// optional: non-admin tidak boleh edit ADMIN
		if (membership.user.role === Roles.ADMIN && jwtUser.role !== Roles.ADMIN) {
			return response_forbidden(c, "You cannot edit ADMIN user")
		}

		const data = await c.req.json<UpdateUserInTenantDTO>()

		const payload: Record<string, unknown> = {}
		if (typeof data.fullName === "string") payload.fullName = data.fullName
		if (typeof data.email === "string") payload.email = data.email
		if (typeof data.phoneNumber === "string")
			payload.phoneNumber = data.phoneNumber

		if (typeof data.password === "string" && data.password.trim().length > 0) {
			payload.password = await bcrypt.hash(data.password, 10)
		}

		if (Object.keys(payload).length === 0) {
			return response_bad_request(c, "No fields to update")
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: payload,
			select: userSelect,
		})

		return response_success(c, updated, "User updated")
	} catch (err) {
		return prismaToHttpError(c, err)
	}
}

// DELETE /tenants/:id/users/manage/:userId
// ✅ delete membership only (NOT delete global user)
export async function removeUserFromTenant(c: Context) {
	try {
		const tenantId = c.req.param("id")
		const userId = c.req.param("userId")
		const jwtUser: UserJWTDAO = c.get("jwtPayload")

		// optional: jangan remove diri sendiri
		if (jwtUser?.id === userId) {
			return response_bad_request(c, "You cannot remove yourself")
		}

		const membership = await prisma.tenantUser.findUnique({
			where: { userId_tenantId: { userId, tenantId } },
			include: { user: true },
		})
		if (!membership) return response_not_found(c)

		// optional: non-admin tidak boleh remove ADMIN
		if (membership.user.role === Roles.ADMIN && jwtUser.role !== Roles.ADMIN) {
			return response_forbidden(c, "You cannot remove ADMIN user")
		}

		await prisma.tenantUser.delete({
			where: { userId_tenantId: { userId, tenantId } },
		})

		return response_success(c, null, "User removed from tenant")
	} catch (err) {
		return prismaToHttpError(c, err)
	}
}
