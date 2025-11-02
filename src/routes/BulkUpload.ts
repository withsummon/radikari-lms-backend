import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as KnowledgeController from "$controllers/rest/KnowledgeController"

const BulkUploadRoutes = new Hono()

BulkUploadRoutes.post("/knowledges", AuthMiddleware.checkJwt, KnowledgeController.bulkCreate)
BulkUploadRoutes.post(
    "/knowledges/case",
    AuthMiddleware.checkJwt,
    KnowledgeController.bulkCreateTypeCase
)

export default BulkUploadRoutes
