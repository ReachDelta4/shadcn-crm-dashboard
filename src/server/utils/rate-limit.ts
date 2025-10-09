type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function memoryRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  if (b.count >= max) {
    return { limited: true, remaining: 0, resetAt: b.resetAt, limit: max }
  }
  b.count++
  return { limited: false, remaining: Math.max(0, max - b.count), resetAt: b.resetAt, limit: max }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string,string> {
  return {
    'X-RateLimit-Limit': String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': new Date(r.resetAt).toISOString(),
  }
}


