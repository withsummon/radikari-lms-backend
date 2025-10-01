import * as Graceful from "$pkg/graceful";
import Logger from "$pkg/logger";
import Redis from "ioredis";
import { ulid } from "ulid";
export class CacheInstance {
    public client: Redis;
    private static instance: CacheInstance;
    private credentials: {

        host: string;
        port: number;
        username: string;
        password: string;
        db: number;

    };

    private constructor() {
        this.credentials = {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            username: process.env.REDIS_USERNAME || 'redis',
            password: process.env.REDIS_PASSWORD || '',
            db: Number(process.env.REDIS_DB) || 0,
        }

        this.client = new Redis({
            host: this.credentials.host,
            port: this.credentials.port,
            username: this.credentials.username,
            password: this.credentials.password,
            db: this.credentials.db,
            retryStrategy: (times) => {
                const maxRetries = 5;
                const baseDelay = 1000; // 1 second

                if (times > maxRetries) {
                    return null; // Stop retrying
                }

                // Exponential backoff: baseDelay * 2^(times-1)
                const delay = baseDelay * Math.pow(2, times - 1);

                // Add some jitter to prevent thundering herd
                const jitter = Math.random() * 200; // 0-200ms random jitter

                return delay + jitter;
            }
        });

        Graceful.registerProcessForShutdown(`redis_${ulid()}`, async () => {
            await this.client.quit();
        });

        this.client.on('error', (err) => {
            Logger.error('Redis Client Error:', err);
        });
    }

    public static getInstance(): CacheInstance {
        if (!CacheInstance.instance) {
            CacheInstance.instance = new CacheInstance();
        }
        return CacheInstance.instance;
    }
}

export * as Method from "./method";
