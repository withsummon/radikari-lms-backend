import { Hono } from "hono"
import * as AssignmentController from "$controllers/rest/AssignmentController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AssignmentValidation from "$validations/AssignmentValidation"
import { TenantRoleIdentifier } from "$entities/TenantRole"

const AssignmentRoutes = new Hono()

AssignmentRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getAll
)

AssignmentRoutes.get(
    "/summary",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getSummaryByTenantId
)

AssignmentRoutes.get(
    "/summary/users",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getUserListWithAssignmentSummaryByTenantId
)

AssignmentRoutes.get(
    "/summary/users/:userId",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getUserAssignmentList
)

AssignmentRoutes.get(
    "/summary/users/:userId/:assignmentId",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getDetailUserAssignmentByUserIdAndAssignmentId
)

AssignmentRoutes.get(
    "/summary/lists",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getAssginmentWithUserSummaryByTenantId
)

AssignmentRoutes.get(
    "/summary/me",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getSummaryByUserIdAndTenantId
)

AssignmentRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getById
)

AssignmentRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleAssignmentAccess([
        TenantRoleIdentifier.TRAINER,
        TenantRoleIdentifier.QUALITY_ASSURANCE,
    ]),
    AssignmentValidation.validateAssignmentSchema,
    AssignmentController.create
)

AssignmentRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleAssignmentAccess([
        TenantRoleIdentifier.TRAINER,
        TenantRoleIdentifier.QUALITY_ASSURANCE,
    ]),
    AssignmentValidation.validateAssignmentSchema,
    AssignmentController.update
)

AssignmentRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleAssignmentAccess([
        TenantRoleIdentifier.TRAINER,
        TenantRoleIdentifier.QUALITY_ASSURANCE,
    ]),
    AssignmentController.deleteById
)

export default AssignmentRoutes
