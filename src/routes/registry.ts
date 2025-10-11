import ExampleBufferRoutes from "./ExampleBuffer"
import UserRoutes from "./User"
import TenantRoutes from "./Tenant"
import MasterKnowledgeCategoryRoutes from "./MasterKnowledgeCategory"
import MasterKnowledgeCaseRoutes from "./MasterKnowledgeCase"
import KnowledgeRoutes from "./Knowledge"

const RoutesRegistry = {
    UserRoutes,
    ExampleBufferRoutes,
    TenantRoutes,
    MasterKnowledgeCategoryRoutes,
    MasterKnowledgeCaseRoutes,
    KnowledgeRoutes,
}

export default RoutesRegistry
