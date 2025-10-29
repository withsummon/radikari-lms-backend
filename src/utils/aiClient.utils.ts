import axios from "axios"
import https from "https"

export function getAiClient() {
    // Create HTTPS agent based on environment configuration
    const sslVerify =
        process.env.AI_API_SSL_VERIFY === "true" || process.env.NODE_ENV === "production"
    const httpsAgent = new https.Agent({
        rejectUnauthorized: sslVerify,
    })

    const client = axios.create({
        baseURL: process.env.AI_API_URL,
        headers: {
            "Content-Type": "application/json",
        },
        httpsAgent: httpsAgent,
        timeout: 30000, // 30 seconds timeout
    })

    // Add request interceptor for logging
    client.interceptors.request.use(
        (config) => {
            console.log(`Making request to: ${config.baseURL}${config.url}`, {
                sslVerify: sslVerify,
                timeout: config.timeout,
            })
            return config
        },
        (error) => {
            console.error("Request error:", error)
            return Promise.reject(error)
        }
    )

    // Add response interceptor for error handling
    client.interceptors.response.use(
        (response) => {
            return response
        },
        (error) => {
            console.error("AI Client API Error:", {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
            })
            return Promise.reject(error)
        }
    )

    return client
}

export const aiClient = getAiClient()
