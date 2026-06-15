import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gk-supply.com"

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { status: "Active", isPublished: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

const staticPages: MetadataRoute.Sitemap = [
  { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
  { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/shipping`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
]

const productPages: MetadataRoute.Sitemap = products.map((p) => ({
  url: `${baseUrl}/products/${p.slug}`,
  lastModified: p.updatedAt,
  changeFrequency: "weekly" as const,
  priority: 0.8,
}))

const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
  url: `${baseUrl}/categories/${c.slug}`,
  lastModified: c.updatedAt,
  changeFrequency: "daily" as const,
  priority: 0.7,
}))

const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
  url: `${baseUrl}/brands/${b.slug}`,
  lastModified: b.updatedAt,
  changeFrequency: "weekly" as const,
  priority: 0.6,
}))

  return [...staticPages, ...productPages, ...categoryPages, ...brandPages]
}
