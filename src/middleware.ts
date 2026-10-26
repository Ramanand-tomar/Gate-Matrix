import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Intercept all API endpoints to protect Firebase Firestore and internal APIs
  if (pathname.startsWith('/api/')) {
    // 1. Resolve real client IP address from proxy / CDN headers
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    // 2. Select rule based on path and HTTP method
    let rule = RATE_LIMIT_RULES.API_READ;
    let category = 'read';

    if (pathname.startsWith('/api/admin')) {
      rule = RATE_LIMIT_RULES.API_ADMIN;
      category = 'admin';
    } else if (
      request.method === 'POST' &&
      (pathname.startsWith('/api/attempts') || pathname.startsWith('/api/orders'))
    ) {
      rule = RATE_LIMIT_RULES.API_WRITE;
      category = 'write';
    } else if (pathname.startsWith('/api/session') || pathname.startsWith('/api/users')) {
      rule = RATE_LIMIT_RULES.API_AUTH;
      category = 'auth';
    }

    // 3. Evaluate rate limit
    const key = `${clientIp}:${category}`;
    const result = checkRateLimit(key, rule.limit, rule.windowMs);

    // 4. If rate limit exceeded, block request with HTTP 429
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Rate limit exceeded. Please wait a moment before trying again.',
          retryAfter: result.resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.resetInSeconds),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      );
    }

    // 5. If allowed, pass request with rate limit telemetry headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
