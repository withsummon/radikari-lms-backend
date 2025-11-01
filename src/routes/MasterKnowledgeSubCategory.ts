import { Hono } from "hono"
import * as MasterKnowledgeSubCategoryController from "$controllers/rest/MasterKnowledgeSubCategoryController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/MasterKnowledgeCategoryValidation"

const MasterKnowledgeSubCategoryRoutes = new Hono()

MasterKnowledgeSubCategoryRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    MasterKnowledgeSubCategoryController.getAll
)

MasterKnowledgeSubCategoryRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    MasterKnowledgeSubCategoryController.getById
)

MasterKnowledgeSubCategoryRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    Validations.validateMasterKnowledgeCategory,
    MasterKnowledgeSubCategoryController.create
)

MasterKnowledgeSubCategoryRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    Validations.validateUpdateMasterKnowledgeCategory,
    MasterKnowledgeSubCategoryController.update
)

MasterKnowledgeSubCategoryRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    MasterKnowledgeSubCategoryController.deleteById
)

export default MasterKnowledgeSubCategoryRoutes
