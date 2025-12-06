import { Hono } from "hono"
import * as MasterKnowledgeCategoryController from "$controllers/rest/MasterKnowledgeCategoryController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/MasterKnowledgeCategoryValidation"

const MasterKnowledgeCategoryRoutes = new Hono()

MasterKnowledgeCategoryRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	MasterKnowledgeCategoryController.getAll,
)

MasterKnowledgeCategoryRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	MasterKnowledgeCategoryController.getById,
)

MasterKnowledgeCategoryRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	Validations.validateMasterKnowledgeCategory,
	MasterKnowledgeCategoryController.create,
)

MasterKnowledgeCategoryRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	Validations.validateUpdateMasterKnowledgeCategory,
	MasterKnowledgeCategoryController.update,
)

MasterKnowledgeCategoryRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	MasterKnowledgeCategoryController.deleteById,
)

export default MasterKnowledgeCategoryRoutes
