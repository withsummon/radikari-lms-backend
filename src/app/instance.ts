import { startRestApp } from "./rest"
import { startConsumerApp } from "./consumer"
import { startCronApp } from "./cron"

const app = {
	restApp: startRestApp,
	consumerApp: startConsumerApp,
	cronApp: startCronApp,
}

export default app
