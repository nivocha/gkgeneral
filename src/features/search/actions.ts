"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
})

export type SearchFilters = z.infer<typeof searchSchema>

export async function searchProducts(raw: SearchFilters) {
  const validated = searchSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, message: "Invalid search parameters", items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const { q, categoryId, brandId, minPrice, maxPrice, sort, page, pageSize } = validated.data
  const sanitized = q.replace(/[^\w\s]/g, "").trim()
  if (!sanitized) {
    return { success: false, message: "Search query is required", items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const conditions: string[] = [`p."deletedAt" IS NULL`, `p."status" = 'Active'`]
  const params: (string | number)[] = [sanitized]

  if (categoryId) {
    conditions.push(`p."categoryId" = $${params.length + 1}`)
    params.push(categoryId)
  }
  if (brandId) {
    conditions.push(`p."brandId" = $${params.length + 1}`)
    params.push(brandId)
  }
  if (minPrice !== undefined) {
    conditions.push(`p."price" >= $${params.length + 1}`)
    params.push(minPrice)
  }
  if (maxPrice !== undefined) {
    conditions.push(`p."price" <= $${params.length + 1}`)
    params.push(maxPrice)
  }

  const whereClause = conditions.join(" AND ")
  const searchCondition = `to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p."shortDescription", '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.sku, '') || ' ' || COALESCE(array_to_string(p.tags, ' '), '')) @@ plainto_tsquery('english', $1)`

  const orderClause =
    sort === "price_asc" ? `p."price" ASC NULLS LAST`
    : sort === "price_desc" ? `p."price" DESC NULLS LAST`
    : sort === "newest" ? `p."createdAt" DESC`
    : `ts_rank(to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p."shortDescription", '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.sku, '') || ' ' || COALESCE(array_to_string(p.tags, ' '), '')), plainto_tsquery('english', $1)) DESC`

  const offset = (page - 1) * pageSize

  try {
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "Product" p WHERE ${whereClause} AND ${searchCondition}`,
      ...params
    )
    const total = Number(countResult[0]?.count || 0)

    const items = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        p.id, p.name, p.slug, p."shortDescription", p.sku,
        p.price, p."comparePrice", p.currency, p.unit, p.tags,
        p."createdAt",
        c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug",
        b.id as "brandId", b.name as "brandName", b.slug as "brandSlug",
        pi.url as "primaryImageUrl", pi.alt as "primaryImageAlt"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      LEFT JOIN LATERAL (
        SELECT url, alt FROM "ProductImage"
        WHERE "productId" = p.id AND "isPrimary" = true
        LIMIT 1
      ) pi ON true
      WHERE ${whereClause} AND ${searchCondition}
      ORDER BY ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      pageSize,
      offset
    )

    return {
      success: true,
      items: items.map((i: any) => ({
        id: i.id,
        name: i.name,
        slug: i.slug,
        shortDescription: i.shortDescription,
        sku: i.sku,
        price: i.price ? Number(i.price) : null,
        comparePrice: i.comparePrice ? Number(i.comparePrice) : null,
        currency: i.currency,
        unit: i.unit,
        tags: i.tags,
        createdAt: i.createdAt,
        category: i.categoryId ? { id: i.categoryId, name: i.categoryName, slug: i.categorySlug } : null,
        brand: i.brandId ? { id: i.brandId, name: i.brandName, slug: i.brandSlug } : null,
        primaryImage: i.primaryImageUrl ? { url: i.primaryImageUrl, alt: i.primaryImageAlt } : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    return { success: false, message: "Search failed", items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }
}

export async function searchAutocomplete(q: string) {
  if (!q || q.length < 2) return { suggestions: [] }

  const sanitized = q.replace(/[^\w\s]/g, "").trim()
  try {
    const results = await prisma.$queryRawUnsafe<{ name: string; slug: string }[]>(
      `SELECT DISTINCT p.name, p.slug FROM "Product" p
       WHERE p."deletedAt" IS NULL AND p."status" = 'Active'
       AND to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.sku, '')) @@ plainto_tsquery('english', $1)
       LIMIT 8`,
      sanitized
    )
    return { suggestions: results.map((r) => ({ name: r.name, slug: r.slug })) }
  } catch {
    return { suggestions: [] }
  }
}
