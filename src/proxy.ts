import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const publicPaths = [
  "/", "/products", "/categories", "/search", "/cart", "/brands", "/pay",
  "/contact", "/api/products", "/api/categories", "/api/auth", "/api/search",
  "/sitemap.xml", "/robots.txt",
]

function getCookie(cookie: string, name: string): string | null {
  for (const part of cookie.split(";")) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  if (pathname.startsWith("/search") || pathname.startsWith("/api/search")) {
    if (!checkRateLimit(`search:${ip}`, 10).allowed) {
      return new NextResponse("Too many requests", { status: 429 })
    }
  }

  const response = NextResponse.next()

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

  if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS === "true") {
    if (request.headers.get("x-forwarded-proto") !== "https") {
      const url = new URL(request.url)
      url.protocol = "https"
      return NextResponse.redirect(url)
    }
  }

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
  const isAuthRoute = authPaths.some((p) => pathname.startsWith(p))
  const isAdminRoute = pathname.startsWith("/admin")

  if (isPublic) return response
  if (isAuthRoute) return response

  // Use raw Cookie header to avoid Next.js __Secure- prefix filtering over HTTP
  const rawCookie = request.headers.get("cookie") || ""
  const sessionToken = getCookie(rawCookie, "__Secure-better-auth.session_token") || getCookie(rawCookie, "better-auth.session_token")

  if (!sessionToken) {
    if (isAdminRoute) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname + (request.nextUrl.search || ""))
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/.*).*)"],
}
