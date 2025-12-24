import { Hono } from "hono"
import * as TenantController from "$controllers/rest/TenantController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/TenantValidation"
import { Roles } from "../../generated/prisma/client"
import * as UserKnowledgeReadLogController from "$controllers/rest/UserKnowledgeReadLogController"

const TenantRoutes = new Hono()

TenantRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	TenantController.getAll,
)

TenantRoutes.get(
  "/:id/knowledge-reads",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkRole([Roles.ADMIN]),
  UserKnowledgeReadLogController.getAll,
)

TenantRoutes.post(
  "/:id/knowledge-reads/view",
  AuthMiddleware.checkJwt,
  UserKnowledgeReadLogController.markViewed,
)

TenantRoutes.get(
  "/knowledge/:knowledgeId/read-status",
  AuthMiddleware.checkJwt,
  UserKnowledgeReadLogController.getStatus,
)

TenantRoutes.get(
	"/users/all",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	TenantController.getAllTenantUsers,
)

TenantRoutes.get(
	"/users",
	AuthMiddleware.checkJwt,
	TenantController.getAllByUser,
)
TenantRoutes.get(
	"/roles",
	AuthMiddleware.checkJwt,
	TenantController.getAllRoles,
)

TenantRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	TenantController.getById,
)

TenantRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	Validations.validateTenantSchema,
	TenantController.create,
)

TenantRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	Validations.validateTenantSchema,
	TenantController.update,
)

TenantRoutes.get(
	"/:id/users",
	AuthMiddleware.checkJwt,
	TenantController.getUserInTenant,
)

TenantRoutes.post(
	"/:id/users",
	AuthMiddleware.checkJwt,
	TenantController.addMember,
)

TenantRoutes.put(
	"/:id/users",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	Validations.validateTenantUserUpdateSchema,
	TenantController.assignUserToTenant,
)

TenantRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	TenantController.deleteById,
)

TenantRoutes.put(
	"/:id/settings",
	AuthMiddleware.checkJwt,
	TenantController.upsertSetting,
)

TenantRoutes.get(
	"/:id/settings",
	AuthMiddleware.checkJwt,
	TenantController.getSettings,
)

TenantRoutes.get(
	"/:id/users/:userId/points",
	AuthMiddleware.checkJwt,
	TenantController.getUserPoints,
)

export default TenantRoutes
