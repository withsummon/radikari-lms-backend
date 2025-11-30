import { Hono } from "hono"
import * as AiChatController from "$controllers/rest/AiChatController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AiChatValidations from "$validations/AiChatValidations"

const ChatRoutes = new Hono()

ChatRoutes.get(
    "/tenants/:tenantId/rooms",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.getAllChatRooms
)

ChatRoutes.get(
    "/tenants/:tenantId/rooms/:chatRoomId",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.getChatRoomById
)

ChatRoutes.post(
    "/tenants/:tenantId/rooms",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatValidations.validateAiChatRoomSchema,
    AiChatController.createChatRoom
)

ChatRoutes.put(
    "/tenants/:tenantId/rooms/:chatRoomId",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatValidations.validateAiChatRoomSchema,
    AiChatController.updateChatRoom
)

ChatRoutes.delete(
    "/tenants/:tenantId/rooms/:chatRoomId",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.deleteChatRoomById
)

ChatRoutes.get(
    "/tenants/:tenantId/rooms/:chatRoomId/history",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.getChatRoomHistory
)

ChatRoutes.post(
    "/tenants/:tenantId/rooms/:chatRoomId/chat",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatValidations.validateAiChatRoomMessageSchema,
    AiChatController.chat
)

ChatRoutes.post(
    "/tenants/:tenantId/rooms/:chatRoomId/stream",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.streamMessage
)

ChatRoutes.post(
    "/tenants/:tenantId/rooms/:chatRoomId/archive",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRoleInTenant,
    AiChatController.archiveOrUnarchiveAiChatRoom
)

export default ChatRoutes
