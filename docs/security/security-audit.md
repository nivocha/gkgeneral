# Security Audit — GK General Supply

## 1. Content Security Policy (CSP)

**Current policy** (in `src/proxy.ts`):
```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

**Assessment**: Reasonable for a Next.js app. The `'unsafe-inline'` and `'unsafe-eval'` for scripts are required by Next.js hydration and dev tooling. In a stricter production environment these could be replaced by a nonce-based approach (Next.js supports `strict-dynamic` via middleware).

**Recommendation**: Add `upgrade-insecure-requests` directive for production to automatically upgrade HTTP to HTTPS. Already applied in `src/proxy.ts`.

## 2. HTTP Strict Transport Security (HSTS)

**Current**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

**Assessment**: 2-year max-age with `includeSubDomains` and `preload` is the industry standard. No changes needed.

## 3. CSRF Protection

- **Better Auth** handles CSRF natively via double-submit cookie pattern for all auth endpoints.
- **Next.js Server Actions** include built-in CSRF protection (origin/host header validation).
- **API routes** should use the `better-auth` CSRF middleware if they accept session cookies; otherwise they should validate `Origin`/`Referer` headers.

No additional CSRF middleware is required.

## 4. Rate Limiting

File: `src/lib/rate-limit.ts` — exists and is functional.

- In-memory `Map`-based rate limiter.
- Tiers: auth (10/min), search (30/min), api (60/min).
- Periodic cleanup every 60s prevents memory leaks.
- Used in `src/proxy.ts` for search endpoints.
- Better Auth handles auth rate limiting natively (already noted in proxy).

**Recommendation**: For multi-instance deployments, replace with an external store (Redis) to share rate limit state across instances.

## 5. Form Input Sanitization

All server actions use **Zod** schema validation. Examples:
- Auth schemas validate email format, password length/minimum strength.
- Product/category schemas validate slugs, prices, and required fields.

Zod's parsing ensures type safety and strips unknown properties. Prisma parameterizes all queries (see #6).

No manual sanitization needed.

## 6. SQL Injection

**Prisma** generates parameterized SQL queries. All user input flows through Prisma's query builder, making SQL injection impossible under normal usage.

Raw queries (`$queryRaw`/`$executeRaw`) are not used in the codebase. If added in the future, they must use parameterized bindings.

## 7. Session Management

- **Better Auth** sessions with 7-day expiry.
- Sliding sessions: activity within the expiry window extends the session.
- Session token stored in HTTP-only, Secure, SameSite=Lax cookie.
- Session validation occurs in `src/middleware.ts` (Better Auth middleware) and via `src/proxy.ts`.

**Assessment**: Session configuration follows OWASP recommendations.

## 8. Recommendation: Duplicate Headers in next.config.ts

The proxy (`src/proxy.ts`) only runs on requests that match the `matcher` pattern. Statically generated pages (SSG) served directly by the Next.js server bypass the proxy.

**Action**: Add an `async headers()` export in `next.config.ts` that sets the same security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy) for all routes `/(.*)`. Already applied.
