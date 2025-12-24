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
import { prisma } from "$pkg/prisma"

// Fix corrupted TenantRole data (P2032 error)
;(async () => {
	try {
		Logger.info("Checking for corrupt TenantRole data...", { resource: "DB_FIX" })
		const count = await prisma.$executeRawUnsafe(`DELETE FROM "TenantRole" WHERE "tenantId" IS NULL`)
		if (Number(count) > 0) {
			Logger.warning(`Deleted ${count} corrupt TenantRole(s) with null tenantId.`, { resource: "DB_FIX" })
		} else {
			Logger.info("No corrupt TenantRole data found.", { resource: "DB_FIX" })
		}
	} catch (error) {
		Logger.error("Failed to clean up corrupt data", { error })
	}
})()

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
