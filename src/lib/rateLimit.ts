/**
 * In-Memory Sliding Window Rate Limiter
 * Protects Firebase Firestore database from traffic spikes, scrapers, and bot abuse.
 * Zero external dependencies; runs directly in Next.js Edge & Node.js runtimes.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  resetAt: number;
}

interface BucketRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

// In-memory bucket store
const bucketMap = new Map<string, BucketRecord>();

// Pre-configured rate limit rules (requests per 60 seconds)
export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  // General read requests (catalog, papers, search)
  API_READ: { limit: 60, windowMs: 60_000 },
  // High-impact write requests (test submissions, attempt saving)
  API_WRITE: { limit: 15, windowMs: 60_000 },
  // Auth & Session management
  API_AUTH: { limit: 25, windowMs: 60_000 },
  // Admin management endpoints
  API_ADMIN: { limit: 30, windowMs: 60_000 },
} as const;

/**
 * Checks if a given identifier (e.g. "ip:route") is within its rate limit.
 *
 * @param identifier Unique key (e.g., client IP + route prefix)
 * @param limit Maximum requests permitted in the window
 * @param windowMs Duration of the rate limit window in milliseconds (default: 60,000ms = 1m)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = bucketMap.get(identifier);

  // Lazy garbage collection: if map exceeds 5,000 entries, prune expired records
  if (bucketMap.size > 5000) {
    for (const [key, record] of bucketMap.entries()) {
      if (record.resetAt <= now) {
        bucketMap.delete(key);
      }
    }
  }

  // If no record exists or window expired, start a fresh bucket
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    bucketMap.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: Math.ceil(windowMs / 1000),
      resetAt,
    };
  }

  // If rate limit is already exceeded
  if (existing.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetInSeconds,
      resetAt: existing.resetAt,
    };
  }

  // Increment usage count
  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: true,
    limit,
    remaining,
    resetInSeconds,
    resetAt: existing.resetAt,
  };
}

/**
 * Helper to reset rate limits (primarily for testing and admin overrides).
 */
export function resetRateLimits(): void {
  bucketMap.clear();
}
