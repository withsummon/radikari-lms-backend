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
}

export default RoutesRegistry
