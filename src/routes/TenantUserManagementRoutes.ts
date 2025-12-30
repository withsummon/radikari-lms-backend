import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
// import * as TenantUserController from "$controllers/rest/TenantUserController"
import * as TenantUserController from "$controllers/rest/TenantUserManagementController"

const TenantUserManagementRoutes = new Hono()

// ==========================
// READ
// ==========================
TenantUserManagementRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("USER_MANAGEMENT", "VIEW"),
	TenantUserController.getAllByTenant,
)

// ==========================
// CREATE
// ==========================
TenantUserManagementRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("USER_MANAGEMENT", "CREATE"),
	TenantUserController.createAndAssignToTenant,
)

// ==========================
// UPDATE
// ==========================
TenantUserManagementRoutes.put(
	"/:userId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("USER_MANAGEMENT", "UPDATE"),
	TenantUserController.updateUserInTenant,
)

// ==========================
// DELETE
// ==========================
TenantUserManagementRoutes.delete(
	"/:userId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("USER_MANAGEMENT", "DELETE"),
	TenantUserController.removeUserFromTenant,
)

export default TenantUserManagementRoutes
