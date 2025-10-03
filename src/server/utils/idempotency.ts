type IdempotencyCache = Map<string, { result: any; timestamp: number }>

const cache: IdempotencyCache = new Map()
const TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function withIdempotency<T>(
	key: string | null | undefined,
	fn: () => Promise<T>
): Promise<T> {
	if (!key) {
		// No idempotency key provided; execute normally
		return await fn()
	}

	const now = Date.now()
	const cached = cache.get(key)
	
	if (cached && (now - cached.timestamp) < TTL_MS) {
		// Return cached result
		return cached.result as T
	}

	// Execute function
	const result = await fn()
	
	// Cache result
	cache.set(key, { result, timestamp: now })
	
	// Cleanup old entries periodically (simple approach)
	if (cache.size > 1000) {
		for (const [k, v] of cache.entries()) {
			if ((now - v.timestamp) >= TTL_MS) {
				cache.delete(k)
			}
		}
	}
	
	return result
}

export function clearIdempotencyCache() {
	cache.clear()
}
