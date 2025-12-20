import { EphemeralThreadStore } from "./EphemeralThreadStore"
import Logger from "$pkg/logger"

export class EphemeralThreadJanitor {
	private static instance: EphemeralThreadJanitor
	private intervalId: NodeJS.Timeout | null = null
	private readonly cleanupInterval: number

	private constructor() {
		// Default 5 minutes
		this.cleanupInterval = parseInt(
			process.env.EPHEMERAL_CLEANUP_INTERVAL || "300000",
		)
	}

	static getInstance(): EphemeralThreadJanitor {
		if (!EphemeralThreadJanitor.instance) {
			EphemeralThreadJanitor.instance = new EphemeralThreadJanitor()
		}
		return EphemeralThreadJanitor.instance
	}

	/**
	 * Start background cleanup job
	 */
	start(): void {
		if (this.intervalId) {
			Logger.error("EphemeralThreadJanitor.start.alreadyRunning", {
				status: "already_started",
			})
			return
		}

		Logger.info("EphemeralThreadJanitor.start", {
			intervalMs: this.cleanupInterval,
		})

		this.intervalId = setInterval(() => {
			this.runCleanup()
		}, this.cleanupInterval)

		// Don't block process exit
		this.intervalId.unref()
	}

	/**
	 * Stop background cleanup job
	 */
	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
			Logger.info("EphemeralThreadJanitor.stop", { status: "stopped" })
		}
	}

	/**
	 * Run cleanup manually
	 */
	private runCleanup(): void {
		Logger.info("EphemeralThreadJanitor.runCleanup.start", {
			trace: "janitor",
		})

		const store = EphemeralThreadStore.getInstance()
		const deletedCount = store.deleteExpiredThreads()

		if (deletedCount > 0) {
			Logger.info("EphemeralThreadJanitor.runCleanup.completed", {
				deletedCount,
			})
		} else {
			Logger.info("EphemeralThreadJanitor.runCleanup.completed", {
				deletedCount: 0,
			})
		}
	}

	/**
	 * Get janitor status
	 */
	getStatus(): {
		isRunning: boolean
		intervalMs: number
	} {
		return {
			isRunning: this.intervalId !== null,
			intervalMs: this.cleanupInterval,
		}
	}
}

// Auto-start janitor when module is loaded
const janitor = EphemeralThreadJanitor.getInstance()
janitor.start()

// Graceful shutdown
process.on("SIGTERM", () => {
	Logger.info("EphemeralThreadJanitor.shutdown", { status: "stopped" })
	janitor.stop()
})
