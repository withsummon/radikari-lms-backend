import { Hono } from "hono"
import * as KnowledgeController from "$controllers/rest/KnowledgeController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/KnowledgeValidation"

const KnowledgeRoutes = new Hono()

KnowledgeRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getAll
)

KnowledgeRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.getById
)

KnowledgeRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    Validations.validateKnowlegeSchema,
    KnowledgeController.create
)

KnowledgeRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    Validations.validateKnowlegeSchema,
    KnowledgeController.update
)

KnowledgeRoutes.put(
    "/:id/approval",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.approveById
)

KnowledgeRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    KnowledgeController.deleteById
)

export default KnowledgeRoutes
