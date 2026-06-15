export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "GK General Supply",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Premium industrial equipment, generators, solar products, electrical equipment, pumps, tools, and machinery supplier.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/gkgeneralsupply",
    facebook: "https://facebook.com/gkgeneralsupply",
  },
  contact: {
    email: "info@gkgeneralsupply.com",
    phone: "+255 700 000 000",
    address: "Dar es Salaam, Tanzania",
  },
  business: {
    registration: "GK General Supply Ltd",
    taxId: "000-000-000",
  },
  features: {
    enableQuotes: true,
    enableReviews: true,
    enableWishlist: true,
    enableCoupons: true,
  },
} as const

export type SiteConfig = typeof siteConfig

export const publicRoutes = [
  "/",
  "/products",
  "/products/(.*)",
  "/categories",
  "/categories/(.*)",
  "/search",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]

export const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]

export const adminRoutes = [
  "/admin",
  "/admin/(.*)",
]

export const customerRoutes = [
  "/account",
  "/account/(.*)",
]

export const DEFAULT_LOGIN_REDIRECT = "/account"
export const DEFAULT_ADMIN_REDIRECT = "/admin/dashboard"
export const DEFAULT_AUTH_REDIRECT = "/"
