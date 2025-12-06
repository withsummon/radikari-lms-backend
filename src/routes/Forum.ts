import { Hono } from "hono"
import * as ForumController from "$controllers/rest/ForumController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as ForumValidation from "$validations/ForumValidation"

const ForumRoutes = new Hono()

ForumRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.getAll,
)

ForumRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.getById,
)

ForumRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumValidation.validateForumSchema,
	ForumController.create,
)

ForumRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumValidation.validateForumSchema,
	ForumController.update,
)

ForumRoutes.post(
	"/:id/like",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.likeForum,
)

ForumRoutes.post(
	"/:id/comments",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumValidation.validateForumCommentSchema,
	ForumController.commentForum,
)

ForumRoutes.get(
	"/:id/comments",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.getForumComments,
)

ForumRoutes.get(
	"/:id/comments/:commentId/replies",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.getForumCommentReplies,
)

ForumRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.deleteById,
)

ForumRoutes.delete(
	"/:id/comments/:commentId",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.deleteForumComment,
)

ForumRoutes.post(
	"/:id/comments/:commentId/like",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.likeOrUnlikeForumComment,
)

ForumRoutes.post(
	"/:id/pin",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	ForumController.pinOrUnpinForum,
)

export default ForumRoutes
