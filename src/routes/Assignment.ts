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
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AssignmentController.getById
)

AssignmentRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    AssignmentValidation.validateAssignmentSchema,
    AuthMiddleware.checkRoleAssignmentAccess([
        TenantRoleIdentifier.TRAINER,
        TenantRoleIdentifier.QUALITY_ASSURANCE,
    ]),
    AssignmentController.create
)

AssignmentRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    AssignmentValidation.validateAssignmentSchema,
    AuthMiddleware.checkRoleAssignmentAccess([
        TenantRoleIdentifier.TRAINER,
        TenantRoleIdentifier.QUALITY_ASSURANCE,
    ]),
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
