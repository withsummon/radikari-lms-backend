import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
// import * as TenantUserController from "$controllers/rest/TenantUserController"
import * as TenantUserController from "$controllers/rest/TenantUserManagementController"

const TenantUserManagementRoutes = new Hono()

// ==========================
// READ (SUDAH BISA)
// ==========================
TenantUserManagementRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant, // cukup member tenant
	TenantUserController.getAllByTenant,
)

// ==========================
// CREATE
// ==========================
TenantUserManagementRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant, // cukup member tenant
	TenantUserController.createAndAssignToTenant,
)

// ==========================
// UPDATE
// ==========================
TenantUserManagementRoutes.put(
	"/:userId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant, // cukup member tenant
	TenantUserController.updateUserInTenant,
)

// ==========================
// DELETE
// ==========================
TenantUserManagementRoutes.delete(
	"/:userId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant, // cukup member tenant
	TenantUserController.removeUserFromTenant,
)

export default TenantUserManagementRoutes
