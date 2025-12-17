import * as AnalyticsController from "$controllers/rest/AnalyticsController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { Hono } from "hono"

const router = new Hono()

router.get("/", AuthMiddleware.checkJwt, AnalyticsController.getAnalytics)

export default router
