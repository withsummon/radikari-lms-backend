//@es-lint next-line ignore
import "dotenv/config"
import "./paths"
//@es-lint next-line ignore

import * as Graceful from "$pkg/graceful"
import Logger from "$pkg/logger/index"
import { displayAsciiArt } from "$utils/ascii_art.utils"
import { REST_ASCII_ART } from "./utils/ascii_art.utils"
// import server from "$server/instance";
import app from "$app/instance"
import { execSync } from "child_process"

try {
	Logger.info("Attempting to resolve failed migration...", { resource: "DB_MIGRATE" })
	execSync("bun run prisma migrate resolve --rolled-back 20251223121920_add_ai_grading_reasoning_field", { stdio: 'inherit' });
	Logger.info("Successfully resolved failed migration", { resource: "DB_MIGRATE" })
} catch (error) {
	Logger.error("Failed to resolve migration (this is expected if it was already resolved or environment issues)", { error })
}

function parseArguments(args: string[]): Record<string, string> {
	const parsedArgs: Record<string, string> = {}

	for (let i = 2; i < args.length; i += 2) {
		const argClean = args[i].replace(/^--/, "") // Remove leading --
		const argName = argClean.split("=")[0] || ""
		const argValue = argClean.split("=")[1] || ""
		parsedArgs[argName] = argValue
	}

	return parsedArgs
}

const parsedArgs = parseArguments(process.argv)

if (parsedArgs["service"] == "rest") {
	displayAsciiArt(REST_ASCII_ART)
	Logger.info(`Started Rest Server on Port ${process.env.PORT}`, {
		state: "started",
		serviceName: process.env.SERVICE_NAME,
		serviceVersion: process.env.SERVICE_VERSION,
		environment: process.env.ENVIRONMENT,
		port: process.env.PORT,
		host: "localhost",
		url: `http://localhost:${process.env.PORT}`,
		resource: "APP_START",
	})
	app.restApp()
}

if (parsedArgs["service"] == "consumer") {
	displayAsciiArt(REST_ASCII_ART)
	Logger.info(`Started Consumer Service`, {
		resource: "consumer",
	})
	app.consumerApp()
}

if (parsedArgs["service"] == "cron") {
	displayAsciiArt(REST_ASCII_ART)
	Logger.info(`Started Cron Service`, {
		resource: "cron",
	})
	app.cronApp()
}

async function gracefulShutdown() {
	Logger.info("Stopping server...", {
		resource: "APP_STOP",
	})
	await Graceful.shutdownProcesses()
	process.exit(0)
}

process.on("SIGINT", gracefulShutdown)
process.on("SIGTERM", gracefulShutdown)
