import ExampleBufferRoutes from "./ExampleBuffer"
import UserRoutes from "./User"
import TenantRoutes from "./Tenant"
import MasterKnowledgeCategoryRoutes from "./MasterKnowledgeCategory"
import MasterKnowledgeCaseRoutes from "./MasterKnowledgeCase"
import KnowledgeRoutes from "./Knowledge"
import OperationRoutes from "./Operation"

const RoutesRegistry = {
    UserRoutes,
    ExampleBufferRoutes,
    OperationRoutes,
    TenantRoutes,
    MasterKnowledgeCategoryRoutes,
    MasterKnowledgeCaseRoutes,
    KnowledgeRoutes,
}

export default RoutesRegistry
