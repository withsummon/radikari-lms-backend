import { Hono } from "hono"
import * as KnowledgeController from "$controllers/rest/KnowledgeController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/KnowledgeValidation"

const KnowledgeRoutes = new Hono()

KnowledgeRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getAll,
)

KnowledgeRoutes.get(
    "/archived",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getAllArchived,
)

KnowledgeRoutes.get(
    "/summary",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getSummary,
)

KnowledgeRoutes.get(
    "/shared/history",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getShareHistory,
)

KnowledgeRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getById,
)

KnowledgeRoutes.get(
    "/:id/versions",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getAllVersionsById,
)

KnowledgeRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    Validations.validateKnowlegeSchema,
    KnowledgeController.create,
)

KnowledgeRoutes.post(
    "/:id/share",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.shareKnowledge,
)

KnowledgeRoutes.post(
    "/bulk",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.bulkCreate,
)

KnowledgeRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    Validations.validateKnowlegeSchema,
    KnowledgeController.update,
)

KnowledgeRoutes.put(
    "/:id/approval",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.approveById,
)

KnowledgeRoutes.put(
    "/:id/archive",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.archiveOrUnarchiveKnowledge,
)

KnowledgeRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.deleteById,
)

export default KnowledgeRoutes