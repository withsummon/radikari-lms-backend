import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as KnowledgeController from "$controllers/rest/KnowledgeController"
import * as Validations from "$validations/KnowledgeValidation"

const BulkUploadRoutes = new Hono()

BulkUploadRoutes.post(
	"/knowledges",
	AuthMiddleware.checkJwt,
	Validations.validateBulkCreateKnowledgeSchema,
	KnowledgeController.bulkCreate,
)
BulkUploadRoutes.post(
	"/knowledges/case",
	AuthMiddleware.checkJwt,
	Validations.validateBulkCreateKnowledgeSchema,
	KnowledgeController.bulkCreateTypeCase,
)

export default BulkUploadRoutes
