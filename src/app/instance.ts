import { startRestApp } from "./rest"
import { startConsumerApp } from "./consumer"

const app = {
    restApp: startRestApp,
    consumerApp: startConsumerApp,
}

export default app
