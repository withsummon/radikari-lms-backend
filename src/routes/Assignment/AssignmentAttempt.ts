import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AssignmentAttemptController from "$controllers/rest/AssignmentAttemptController"
import * as AssignmentValidation from "$validations/AssignmentValidation"

const AssignmentAttemptRoutes = new Hono()

AssignmentAttemptRoutes.get(
    "/attempts/current",
    AuthMiddleware.checkJwt,
    AssignmentAttemptController.getCurrentUserAssignmentAttempt
)

AssignmentAttemptRoutes.post(
    "/:assignmentId/attempts",
    AuthMiddleware.checkJwt,
    AssignmentAttemptController.create
)

AssignmentAttemptRoutes.get(
    "/:assignmentId/attempts/questions",
    AuthMiddleware.checkJwt,
    AssignmentAttemptController.getAllQuestionsAndAnswers
)

AssignmentAttemptRoutes.put(
    "/:assignmentId/attempts/answer",
    AuthMiddleware.checkJwt,
    AssignmentValidation.validateAssignmentUserAttemptAnswerSchema,
    AssignmentAttemptController.updateAnswer
)

AssignmentAttemptRoutes.put(
    "/:assignmentId/attempts/submit",
    AuthMiddleware.checkJwt,
    AssignmentAttemptController.submitAssignment
)

AssignmentAttemptRoutes.get(
    "/:assignmentId/attempts/history",
    AuthMiddleware.checkJwt,
    AssignmentAttemptController.getHistoryUserAssignmentAttempts
)

export default AssignmentAttemptRoutes
