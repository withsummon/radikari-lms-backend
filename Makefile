restapi:
	export SERVICE_NAME=nodewave-be-restapi && bun run dev -- --service=rest

cron:
	export SERVICE_NAME=nodewave-be-cron && bun run dev -- --service=cron

restapi-prod:
	export SERVICE_NAME=nodewave-be-restapi && bun start -- --service=rest

cron-prod:
	export SERVICE_NAME=nodewave-be-cron && bun start -- --service=cron



