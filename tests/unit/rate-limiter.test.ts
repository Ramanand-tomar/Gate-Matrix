import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimits, RATE_LIMIT_RULES } from '@/lib/rateLimit';

describe('Rate Limiter & Anti-Abuse Protection Tests', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('RL-01: Allows requests within defined rate limit', () => {
    const key = 'test-ip-1:read';
    const limit = 5;

    for (let i = 1; i <= limit; i++) {
      const res = checkRateLimit(key, limit, 60_000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(limit - i);
    }
  });

  it('RL-02: Blocks requests exceeding rate limit with HTTP 429 semantics', () => {
    const key = 'test-ip-2:write';
    const limit = 3;

    // Use up the 3 permitted tokens
    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);

    // 4th request must be blocked
    const blockedRes = checkRateLimit(key, limit, 60_000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
    expect(blockedRes.resetInSeconds).toBeLessThanOrEqual(60);
  });

  it('RL-03: Resets window after expiry or explicit reset', () => {
    const key = 'test-ip-3:admin';
    const limit = 2;

    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);
    expect(checkRateLimit(key, limit, 60_000).allowed).toBe(false);

    // Reset buckets
    resetRateLimits();

    // Now request should be allowed again
    const freshRes = checkRateLimit(key, limit, 60_000);
    expect(freshRes.allowed).toBe(true);
    expect(freshRes.remaining).toBe(1);
  });

  it('RL-04: Exposes standard production rule presets', () => {
    expect(RATE_LIMIT_RULES.API_READ.limit).toBe(60);
    expect(RATE_LIMIT_RULES.API_WRITE.limit).toBe(15);
    expect(RATE_LIMIT_RULES.API_AUTH.limit).toBe(25);
    expect(RATE_LIMIT_RULES.API_ADMIN.limit).toBe(30);
  });
});
