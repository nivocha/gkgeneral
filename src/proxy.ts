import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const publicPaths = [
  "/", "/products", "/categories", "/search", "/cart", "/brands",
  "/contact", "/api/products", "/api/categories", "/api/auth", "/api/search",
  "/sitemap.xml", "/robots.txt",
]

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting — Better Auth handles auth rate limiting natively (10/min)
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  if (pathname.startsWith("/search") || pathname.startsWith("/api/search")) {
    if (!checkRateLimit(`search:${ip}`, 10).allowed) {
      return new NextResponse("Too many requests", { status: 429 })
    }
  }

  const response = NextResponse.next()

  // Security Headers (production only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self'",
        "connect-src 'self' https:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        
      ].join("; ")
    )
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  }

  // HTTPS redirect in production
  if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS === "true") {
    if (request.headers.get("x-forwarded-proto") !== "https") {
      const url = new URL(request.url)
      url.protocol = "https"
      return NextResponse.redirect(url)
    }
  }

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const isAuthRoute = authPaths.some((p) => pathname.startsWith(p))
  const isAdminRoute = pathname.startsWith("/admin")
  const isCustomerRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout")

  // Allow public routes immediately
  if (isPublic) {
    return response
  }

  // Allow auth routes (login, register, etc.) — no session check needed
  if (isAuthRoute) {
    return response
  }

  // Protected routes: require session
  const sessionCookie = request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    if (isAdminRoute || isCustomerRoute) {
      const loginUrl = new URL("/login", request.url)
      const redirectPath = pathname + (request.nextUrl.search || "")
      loginUrl.searchParams.set("redirect", redirectPath)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Authenticated users trying to access auth routes — redirect away
  if (isAuthRoute) {
    // Default customer redirect
    const destination = new URL("/account", request.url)
    return NextResponse.redirect(destination)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/.*).*)"],
}
