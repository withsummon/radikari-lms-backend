import { Hono } from "hono"
import * as NotificationController from "$controllers/rest/NotificationController"
import * as AuthMiddleware from "$middlewares/authMiddleware"

const NotificationRoutes = new Hono()

// Get all notifications for authenticated user
NotificationRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    NotificationController.getAll,
)

// Get unread notification count
NotificationRoutes.get(
    "/unread-count",
    AuthMiddleware.checkJwt,
    NotificationController.getUnreadCount,
)

// Mark specific notification as read
NotificationRoutes.put(
    "/:id/read",
    AuthMiddleware.checkJwt,
    NotificationController.markAsRead,
)

// Mark all notifications as read
NotificationRoutes.put(
    "/read-all",
    AuthMiddleware.checkJwt,
    NotificationController.markAllAsRead,
)

// Delete a notification
NotificationRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    NotificationController.deleteById,
)

export default NotificationRoutes

