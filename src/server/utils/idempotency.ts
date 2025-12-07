export interface IdempotencyEntry<T = any> {
  result: T
  timestamp: number
}

export interface IdempotencyStore {
  get<T = any>(key: string): IdempotencyEntry<T> | null
  set<T = any>(key: string, entry: IdempotencyEntry<T>): void
  clear?(): void
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes

class InMemoryIdempotencyStore implements IdempotencyStore {
  private cache = new Map<string, IdempotencyEntry>()

  get<T = any>(key: string): IdempotencyEntry<T> | null {
    return (this.cache.get(key) as IdempotencyEntry<T> | undefined) ?? null
  }

  set<T = any>(key: string, entry: IdempotencyEntry<T>): void {
    this.cache.set(key, entry)

    // Best-effort cleanup for stale entries to avoid unbounded growth
    if (this.cache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp >= TTL_MS) {
          this.cache.delete(k)
        }
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

let store: IdempotencyStore = new InMemoryIdempotencyStore()

export function setIdempotencyStore(next: IdempotencyStore): void {
  store = next
}

export function getIdempotencyStore(): IdempotencyStore {
  return store
}

export async function withIdempotency<T>(
  key: string | null | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (!key) {
    // No idempotency key provided; execute normally
    return await fn()
  }

  const now = Date.now()
  const cached = store.get<T>(key)

  if (cached && (now - cached.timestamp) < TTL_MS) {
    // Return cached result
    return cached.result as T
  }

  const result = await fn()

  store.set<T>(key, { result, timestamp: now })

  return result
}

export function clearIdempotencyCache(): void {
  if (typeof store.clear === 'function') {
    store.clear()
  }
}
