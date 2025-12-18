import { ModelMessage } from "ai"
import { executeHybridChatCore } from "../AiChat/HybridChatCore"
import { EphemeralThreadStore } from "./EphemeralThreadStore"
import Logger from "$pkg/logger"

interface EphemeralRagRunnerRequest {
	messages: ModelMessage[]
	tenantId: string
	threadId: string
}

/**
 * Ephemeral RAG Runner
 * - Calls HybridChatCore (pure RAG)
 * - Updates thread in memory
 * - NO persistence, NO identity, NO PII
 * - Fail fast on identity parameters
 */
export async function runEphemeralRag({
	messages,
	tenantId,
	threadId,
}: EphemeralRagRunnerRequest): Promise<Response> {
	Logger.info("EphemeralRagRunner.run", {
		threadId,
		tenantId,
		messageCount: messages.length,
	})

	// FAIL FAST: Ensure no identity parameters are present
	// This is a static guarantee - any code passing userId will error
	validateNoIdentityParameters(arguments[0])

	// Get thread from store
	const store = EphemeralThreadStore.getInstance()
	const thread = store.getThread(tenantId, threadId)

	if (!thread) {
		Logger.info("EphemeralRagRunner.run.threadNotFound", {
			threadId,
			tenantId,
		})
		throw new Error("Thread not found or expired")
	}

	// Add user message to thread
	const lastMessage = messages[messages.length - 1]
	if (lastMessage && lastMessage.role === "user") {
		store.addMessage(tenantId, threadId, lastMessage)
	}

	// Execute pure RAG core
	const response = await executeHybridChatCore({
		messages,
		tenantId,
		onFinish: ({ text }) => {
			// Add assistant message to memory thread for context in next turn
			store.addMessage(tenantId, threadId, {
				role: "assistant",
				content: text,
			})

			Logger.info("EphemeralRagRunner.run.completed", {
				threadId,
				tenantId,
				finalMessageCount: thread.messages.length,
			})
		},
	})

	return response
}

/**
 * Fail-fast validation: Ensure no identity parameters
 * This is a runtime guard against developer errors
 */
function validateNoIdentityParameters(params: any): void {
	const forbiddenFields = ["userId", "user_id", "authContext", "session", "jwt"]
	const foundFields: string[] = []

	if (!params) return

	for (const field of forbiddenFields) {
		if (params[field] !== undefined) {
			foundFields.push(field)
		}
	}

	if (foundFields.length > 0) {
		const error = new Error(
			`EphemeralRagRunner received forbidden identity parameters: ${foundFields.join(
				", ",
			)}. ` + `Ephemeral threads must not contain user identity information.`,
		)
		Logger.error("EphemeralRagRunner.validateNoIdentityParameters", {
			foundFields,
			error: error.message,
		})
		throw error
	}
}
