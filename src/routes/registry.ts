import ExampleBufferRoutes from "./ExampleBuffer"
import UserRoutes from "./User"
import TenantRoutes from "./Tenant"
import MasterKnowledgeCategoryRoutes from "./MasterKnowledgeCategory"
import MasterKnowledgeCaseRoutes from "./MasterKnowledgeCase"
import KnowledgeRoutes from "./Knowledge"
import OperationRoutes from "./Operation"
import ChatRoutes from "./AiChat/Chat"

const RoutesRegistry = {
    UserRoutes,
    ExampleBufferRoutes,
    OperationRoutes,
    TenantRoutes,
    MasterKnowledgeCategoryRoutes,
    MasterKnowledgeCaseRoutes,
    KnowledgeRoutes,
    ChatRoutes,
}

export default RoutesRegistry
