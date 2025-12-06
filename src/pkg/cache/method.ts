import Logger from "$pkg/logger"
import { CacheInstance } from "./index"

export type CacheOptions = {
	ttl: number
}

export async function get<T>(key: string): Promise<T | null> {
	try {
		const value = await CacheInstance.getInstance().client.get(key)
		if (!value) return null

		let parsedValue: T
		try {
			parsedValue = JSON.parse(value) as T
		} catch (err) {
			parsedValue = value as T
		}

		return parsedValue
	} catch (error) {
		Logger.error("Redis cache get error:", error)
		throw new Error("Redis cache get error:")
	}
}

export async function wrapWithCache<T>(
	key: string,
	fn: () => Promise<T>,
	options?: CacheOptions,
): Promise<T> {
	const cachedData = await get<T>(key)
	if (cachedData) return cachedData

	let data: T
	data = await fn()
	if (data == null) {
		return data
	}

	const stringValue = JSON.stringify(data)
	if (options?.ttl) {
		await CacheInstance.getInstance().client.setex(
			key,
			options.ttl,
			stringValue,
		)
	} else {
		await CacheInstance.getInstance().client.set(key, stringValue)
	}
	return data
}

export async function set<T>(
	key: string,
	value: T,
	options?: CacheOptions,
): Promise<void> {
	try {
		const stringValue = JSON.stringify(value)
		if (options?.ttl) {
			await CacheInstance.getInstance().client.setex(
				key,
				options.ttl,
				stringValue,
			)
		} else {
			await CacheInstance.getInstance().client.set(key, stringValue)
		}
	} catch (error) {
		Logger.error("Redis cache set error:", error)
		throw new Error("Redis cache set error:")
	}
}

export async function removeCache(key: string): Promise<void> {
	try {
		await CacheInstance.getInstance().client.del(key)
	} catch (error) {
		Logger.error("Redis cache remove error:", error)
		throw new Error("Redis cache remove error:")
	}
}

export async function removeCacheByPattern(pattern: string): Promise<void> {
	try {
		const client = CacheInstance.getInstance().client

		let cursor = "0"
		const keysToDelete: string[] = []

		do {
			const [nextCursor, keys] = await client.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				100,
			)
			cursor = nextCursor
			keysToDelete.push(...keys)
		} while (cursor !== "0")

		if (keysToDelete.length > 0) {
			await client.del(...keysToDelete)
			Logger.info(
				`Deleted ${keysToDelete.length} keys matching pattern "${pattern}"`,
				{ keysToDelete },
			)
		} else {
			Logger.info(`No keys matched pattern "${pattern}"`, { keysToDelete })
		}
	} catch (error) {
		Logger.error(`Redis cache remove error for pattern "${pattern}":`, error)
		throw new Error(`Redis cache remove error for pattern "${pattern}":`)
	}
}

export async function extendTTL(key: string, newTTL: number): Promise<boolean> {
	try {
		// Returns 1 if the timeout was set, 0 if key doesn't exist
		const result = await CacheInstance.getInstance().client.expire(key, newTTL)
		return result === 1
	} catch (error) {
		Logger.error("Redis cache extend TTL error:", error)
		throw new Error("Redis cache extend TTL error")
	}
}

export async function purgeCache(): Promise<void> {
	try {
		await CacheInstance.getInstance().client.flushall()
	} catch (error) {
		Logger.error("Redis cache flushAll error:", error)
		throw new Error("Redis cache flushAll error:")
	}
}

export async function ping(): Promise<boolean> {
	try {
		const result = await CacheInstance.getInstance().client.ping()
		return result === "PONG"
	} catch (error) {
		Logger.error("Redis cache ping error:", error)
		return false
	}
}
