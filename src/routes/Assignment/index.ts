import { Hono } from "hono"
import AssignmentAttemptRoutes from "./AssignmentAttempt"
import MasterAssignmentRoutes from "./MasterAssignment"

const AssignmentRoutes = new Hono()

AssignmentRoutes.route("/", AssignmentAttemptRoutes)
AssignmentRoutes.route("/", MasterAssignmentRoutes)

export default AssignmentRoutes
