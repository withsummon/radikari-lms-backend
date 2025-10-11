import { Hono } from "hono"
import * as MasterKnowledgeCaseController from "$controllers/rest/MasterKnowledgeCaseController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/MasterKnowledgeCaseValidation"

const MasterKnowledgeCaseRoutes = new Hono()

MasterKnowledgeCaseRoutes.get("/", AuthMiddleware.checkJwt, MasterKnowledgeCaseController.getAll)

MasterKnowledgeCaseRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    MasterKnowledgeCaseController.getById
)

MasterKnowledgeCaseRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    Validations.validateMasterKnowledgeCaseSchema,
    MasterKnowledgeCaseController.create
)

MasterKnowledgeCaseRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    Validations.validateUpdateMasterKnowledgeCaseSchema,
    MasterKnowledgeCaseController.update
)

MasterKnowledgeCaseRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    MasterKnowledgeCaseController.deleteById
)

export default MasterKnowledgeCaseRoutes
