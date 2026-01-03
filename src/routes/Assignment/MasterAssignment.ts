import { Hono } from "hono"
import * as AssignmentController from "$controllers/rest/AssignmentController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AssignmentValidation from "$validations/AssignmentValidation"
const AssignmentRoutes = new Hono()

AssignmentRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getAll,
)

AssignmentRoutes.get(
	"/summary",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getSummaryByTenantId,
)

AssignmentRoutes.get(
	"/summary/users",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getUserListWithAssignmentSummaryByTenantId,
)

AssignmentRoutes.get(
	"/summary/users/:userId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getUserAssignmentList,
)

AssignmentRoutes.get(
	"/summary/users/:userId/:assignmentId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getDetailUserAssignmentByUserIdAndAssignmentId,
)

AssignmentRoutes.get(
	"/summary/lists",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getAssginmentWithUserSummaryByTenantId,
)

AssignmentRoutes.get(
	"/summary/me",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getSummaryByUserIdAndTenantId,
)

AssignmentRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getById,
)

AssignmentRoutes.get(
	"/:id/statistics",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AssignmentController.getStatistics,
)

AssignmentRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("ASSIGNMENT", "CREATE"),
	AssignmentValidation.validateAssignmentSchema,
	AssignmentController.create,
)

AssignmentRoutes.post(
	"/generate-questions",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("ASSIGNMENT", "CREATE"),
	AssignmentController.generateQuestionsStream,
)

AssignmentRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("ASSIGNMENT", "UPDATE"),
	AssignmentValidation.validateAssignmentSchema,
	AssignmentController.update,
)

AssignmentRoutes.post(
	"/:id/approve",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("ASSIGNMENT", "APPROVAL"),
	AssignmentController.approveById,
)

AssignmentRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkAccessTenantRole("ASSIGNMENT", "DELETE"),
	AssignmentController.deleteById,
)

export default AssignmentRoutes
