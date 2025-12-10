import ExampleBufferRoutes from "./ExampleBuffer"
import UserRoutes from "./User"
import TenantRoutes from "./Tenant"
import MasterKnowledgeCategoryRoutes from "./MasterKnowledgeCategory"
import MasterKnowledgeSubCategoryRoutes from "./MasterKnowledgeSubCategory"
import MasterKnowledgeCaseRoutes from "./MasterKnowledgeCase"
import KnowledgeRoutes from "./Knowledge"
import OperationRoutes from "./Operation"
import ChatRoutes from "./AiChat/Chat"
import BulkKnowledgeRoutes from "./BulkUpload"
import AccessControlListRoutes from "./AccessControlList"
import AssignmentRoutes from "./Assignment"
import AnnouncementRoutes from "./Announcement"
import ForumRoutes from "./Forum"
import UserActivityLogRoutes from "./UserActivityLog"
import NotificationRoutes from "./Notification"
import BroadcastRoutes from "./Broadcast"
import AiPromptRoutes from "./AiPrompt"

const RoutesRegistry = {
    UserRoutes,
    ExampleBufferRoutes,
    OperationRoutes,
    TenantRoutes,
    MasterKnowledgeCategoryRoutes,
    MasterKnowledgeSubCategoryRoutes,
    MasterKnowledgeCaseRoutes,
    KnowledgeRoutes,
    ChatRoutes,
    BulkKnowledgeRoutes,
    AccessControlListRoutes,
    AssignmentRoutes,
    AnnouncementRoutes,
    ForumRoutes,
    UserActivityLogRoutes,
    NotificationRoutes,
    BroadcastRoutes,
    AiPromptRoutes,
}

export default RoutesRegistry
