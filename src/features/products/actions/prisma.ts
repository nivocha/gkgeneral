"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma, ProductStatus } from "@/lib/prisma"
import { slugify, generateSKU } from "@/lib/utils"
import { requireAuth, requireRole } from "@/lib/auth/session"
import { auditLog } from "@/lib/logger"

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().default("piece"),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  minOrderQuantity: z.coerce.number().min(1).default(1),
  maxOrderQuantity: z.coerce.number().optional(),
  status: z.nativeEnum(ProductStatus).default("Draft"),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  price: z.coerce.number().positive("Price must be positive").optional(),
  comparePrice: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  currency: z.string().default("TZS"),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "Variant SKU is required"),
  price: z.coerce.number().positive("Price must be positive"),
  costPrice: z.coerce.number().optional(),
  attributes: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
})

const specSchema = z.object({
  label: z.string().min(1, "Spec label is required"),
  value: z.string().min(1, "Spec value is required"),
  unit: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
})

const downloadSchema = z.object({
  name: z.string().min(1, "Download name is required"),
  url: z.string().url("Must be a valid URL"),
  fileSize: z.string().optional(),
  type: z.enum(["MANUAL", "DATASHEET", "WARRANTY", "CERTIFICATE", "OTHER"]).default("OTHER"),
})

export type ProductFormData = z.infer<typeof productSchema>

export type ProductListFilters = {
  search?: string
  status?: ProductStatus | "all"
  categoryId?: string
  brandId?: string
  featured?: boolean
  sort?: "newest" | "oldest" | "name_asc" | "name_desc" | "price_asc" | "price_desc"
  page?: number
  pageSize?: number
}

export async function getProductsList(filters: ProductListFilters) {
  const {
    search,
    status,
    categoryId,
    brandId,
    featured,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = filters

  const where: any = { deletedAt: null }

  if (status && status !== "all") where.status = status
  if (categoryId) where.categoryId = categoryId
  if (brandId) where.brandId = brandId
  if (featured !== undefined) where.isFeatured = featured
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: any =
    sort === "oldest" ? { createdAt: "asc" as const }
    : sort === "name_asc" ? { name: "asc" as const }
    : sort === "name_desc" ? { name: "desc" as const }
    : sort === "price_asc" ? { price: "asc" as const }
    : sort === "price_desc" ? { price: "desc" as const }
    : { createdAt: "desc" as const }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        inventories: { select: { quantity: true, reservedQuantity: true, minStockLevel: true } },
        _count: { select: { variants: true, images: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  const totalStock = items.map((p) =>
    p.inventories.reduce((sum, i) => sum + i.quantity, 0)
  )
  const totalReserved = items.map((p) =>
    p.inventories.reduce((sum, i) => sum + i.reservedQuantity, 0)
  )
  const minLevels = items.map((p) =>
    p.inventories.length > 0
      ? Math.min(...p.inventories.map((i) => i.minStockLevel))
      : 5
  )

  return {
    items: items.map((p, idx) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      weight: p.weight ? Number(p.weight) : null,
      primaryImage: p.images[0] || null,
      variantCount: p._count.variants,
      imageCount: p._count.images,
      stockQuantity: totalStock[idx],
      reservedQuantity: totalReserved[idx],
      minStockLevel: minLevels[idx],
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      downloads: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      inventories: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
  })

  if (!product) return null

  return {
    ...product,
    price: product.price ? Number(product.price) : null,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      costPrice: v.costPrice ? Number(v.costPrice) : null,
    })),
    stockQuantity: product.inventories.reduce((s, i) => s + i.quantity, 0),
    reservedQuantity: product.inventories.reduce((s, i) => s + i.reservedQuantity, 0),
  }
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: "Active" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      downloads: { orderBy: { createdAt: "desc" } },
      inventories: { select: { quantity: true, reservedQuantity: true } },
    },
  })

  if (!product) return null

  return {
    ...product,
    price: product.price ? Number(product.price) : null,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      costPrice: v.costPrice ? Number(v.costPrice) : null,
    })),
    stockQuantity: product.inventories.reduce((s, i) => s + i.quantity, 0),
  }
}

export async function createProduct(
  data: ProductFormData & {
    variants?: (Omit<z.infer<typeof variantSchema>, "attributes"> & { attributes?: string })[]
    specifications?: z.infer<typeof specSchema>[]
    downloads?: z.infer<typeof downloadSchema>[]
  }
) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const validated = productSchema.parse(data)
  const slug = slugify(validated.name)
  const sku = validated.sku || generateSKU(validated.categoryId || "GEN", validated.name, crypto.randomUUID())

  const product = await prisma.product.create({
    data: {
      ...validated,
      slug,
      sku,
      price: validated.price ?? undefined,
      comparePrice: validated.comparePrice ?? undefined,
      costPrice: validated.costPrice ?? undefined,
      tags: validated.tags ?? [],
      variants: data.variants?.length
        ? {
            create: data.variants.map((v) => ({
              name: v.name,
              sku: v.sku,
              price: v.price,
              costPrice: v.costPrice ?? undefined,
              attributes: v.attributes ? JSON.parse(v.attributes) : undefined,
              isActive: v.isActive,
              sortOrder: v.sortOrder ?? 0,
            })),
          }
        : undefined,
      specifications: data.specifications?.length
        ? { create: data.specifications.map((s) => ({ ...s, unit: s.unit ?? undefined })) }
        : undefined,
      downloads: data.downloads?.length
        ? { create: data.downloads.map((d) => ({ ...d, type: d.type as any })) }
        : undefined,
      statusHistory: {
        create: {
          status: validated.status,
          changedBy: user.id,
          note: "Product created",
        },
      },
    },
    include: { variants: true, specifications: true, downloads: true },
  })

  await auditLog(
    user.id,
    "product.created",
    "product",
    product.id,
    `Created product: ${product.name}`,
    { status: validated.status }
  )

  revalidatePath("/admin/dashboard/products")
  revalidatePath("/products")
  revalidatePath("/")

  return { success: true, message: "Product created successfully", id: product.id }
}

export async function updateProduct(
  id: string,
  data: ProductFormData & {
    variants?: (Omit<z.infer<typeof variantSchema>, "attributes"> & { id?: string; attributes?: string })[]
    specifications?: (z.infer<typeof specSchema> & { id?: string })[]
    downloads?: (z.infer<typeof downloadSchema> & { id?: string })[]
  }
) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) {
    return { success: false, message: "Product not found" }
  }

  const validated = productSchema.parse(data)
  const slug = slugify(validated.name)

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        ...validated,
        slug,
        sku: validated.sku || existing.sku,
        price: validated.price ?? undefined,
        comparePrice: validated.comparePrice ?? undefined,
        costPrice: validated.costPrice ?? undefined,
        tags: validated.tags ?? [],
        isPublished: validated.isPublished,
      },
    })

    if (validated.status !== existing.status) {
      await tx.productStatusHistory.create({
        data: {
          productId: id,
          status: validated.status,
          changedBy: user.id,
          note: `Status changed from ${existing.status} to ${validated.status}`,
        },
      })
      await auditLog(
        user.id,
        "product.status_changed",
        "product",
        id,
        `Status changed from ${existing.status} to ${validated.status}`,
        { from: existing.status, to: validated.status }
      )
    }

    if (data.variants !== undefined) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      })
      const incomingIds = data.variants.filter((v) => v.id).map((v) => v.id!)
      const toDelete = existingVariants
        .filter((v) => !incomingIds.includes(v.id))
        .map((v) => v.id)

      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const v of data.variants) {
        const variantData: any = {
          name: v.name,
          sku: v.sku,
          price: v.price,
          costPrice: v.costPrice ?? undefined,
          attributes: v.attributes ? JSON.parse(v.attributes) : undefined,
          isActive: v.isActive,
          sortOrder: v.sortOrder ?? 0,
        }
        if (v.id) {
          await tx.productVariant.update({ where: { id: v.id }, data: variantData })
        } else {
          await tx.productVariant.create({
            data: { ...variantData, productId: id },
          })
        }
      }
    }

    if (data.specifications !== undefined) {
      await tx.productSpecification.deleteMany({ where: { productId: id } })
      if (data.specifications.length > 0) {
        await tx.productSpecification.createMany({
          data: data.specifications.map((s) => ({
            productId: id,
            label: s.label,
            value: s.value,
            unit: s.unit ?? undefined,
            sortOrder: s.sortOrder ?? 0,
          })),
        })
      }
    }

    if (data.downloads !== undefined) {
      await tx.productDownload.deleteMany({ where: { productId: id } })
      if (data.downloads.length > 0) {
        await tx.productDownload.createMany({
          data: data.downloads.map((d) => ({
            productId: id,
            name: d.name,
            url: d.url,
            fileSize: d.fileSize,
            type: d.type as any,
          })),
        })
      }
    }

    return updated
  })

  await auditLog(user.id, "product.updated", "product", id, `Updated product: ${validated.name}`)

  revalidatePath("/admin/dashboard/products")
  revalidatePath(`/admin/dashboard/products/${id}/edit`)
  revalidatePath("/products")
  revalidatePath(`/products/${product.slug}`)
  revalidatePath("/")

  return { success: true, message: "Product updated successfully" }
}

export async function deleteProduct(id: string) {
  const user = await requireRole("super_admin", "admin")

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) {
    return { success: false, message: "Product not found" }
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await auditLog(user.id, "product.deleted", "product", id, `Deleted product: ${existing.name}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/products")
  revalidatePath("/")

  return { success: true, message: "Product deleted" }
}

export async function bulkDeleteProducts(ids: string[]) {
  const user = await requireRole("super_admin", "admin")

  await prisma.product.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  await auditLog(
    user.id,
    "product.bulk_deleted",
    "product",
    ids.join(","),
    `Bulk deleted ${ids.length} products`
  )

  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: `${ids.length} products deleted` }
}

export async function bulkUpdateStatus(ids: string[], status: ProductStatus) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  await prisma.product.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  })

  for (const id of ids) {
    await prisma.productStatusHistory.create({
      data: { productId: id, status, changedBy: user.id, note: `Bulk status update to ${status}` },
    })
  }

  await auditLog(
    user.id,
    "product.bulk_status",
    "product",
    ids.join(","),
    `Bulk status updated ${ids.length} products to ${status}`
  )

  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: `${ids.length} products updated` }
}

export async function createVariant(
  productId: string,
  data: z.infer<typeof variantSchema>
) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const validated = variantSchema.parse(data)
  const variant = await prisma.productVariant.create({
    data: {
      ...validated,
      price: validated.price,
      attributes: validated.attributes ? JSON.parse(validated.attributes) : undefined,
      productId,
    },
  })

  await auditLog(user.id, "product.variant_created", "product_variant", variant.id, `Created variant: ${validated.name}`)
  revalidatePath(`/admin/dashboard/products/${productId}/edit`)
  revalidatePath("/")

  return { success: true, message: "Variant created", id: variant.id }
}

export async function updateVariant(id: string, data: z.infer<typeof variantSchema>) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const validated = variantSchema.parse(data)
  await prisma.productVariant.update({
    where: { id },
    data: {
      ...validated,
      price: validated.price,
      attributes: validated.attributes ? JSON.parse(validated.attributes) : undefined,
    },
  })

  await auditLog(user.id, "product.variant_updated", "product_variant", id, `Updated variant: ${validated.name}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: "Variant updated" }
}

export async function deleteVariant(id: string) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const variant = await prisma.productVariant.findUnique({ where: { id } })
  if (!variant) return { success: false, message: "Variant not found" }

  await prisma.productVariant.delete({ where: { id } })
  await auditLog(user.id, "product.variant_deleted", "product_variant", id, `Deleted variant: ${variant.name}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: "Variant deleted" }
}

export async function uploadProductImage(
  productId: string,
  data: { url: string; alt?: string; isPrimary?: boolean }
) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const count = await prisma.productImage.count({ where: { productId } })
  const image = await prisma.productImage.create({
    data: {
      productId,
      url: data.url,
      alt: data.alt,
      isPrimary: data.isPrimary ?? count === 0,
      sortOrder: count,
    },
  })

  if (data.isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId, id: { not: image.id }, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  await auditLog(user.id, "product.image_uploaded", "product_image", image.id, `Image uploaded for product ${productId}`)
  revalidatePath(`/admin/dashboard/products/${productId}/edit`)
  revalidatePath("/")

  return { success: true, message: "Image uploaded", id: image.id }
}

export async function deleteProductImage(id: string) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const image = await prisma.productImage.findUnique({ where: { id } })
  if (!image) return { success: false, message: "Image not found" }

  await prisma.productImage.delete({ where: { id } })

  const remaining = await prisma.productImage.count({ where: { productId: image.productId } })
  if (remaining > 0 && image.isPrimary) {
    const first = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
    })
    if (first) {
      await prisma.productImage.update({ where: { id: first.id }, data: { isPrimary: true } })
    }
  }

  await auditLog(user.id, "product.image_deleted", "product_image", id, `Deleted image from product ${image.productId}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: "Image deleted" }
}

export async function setPrimaryImage(id: string) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const image = await prisma.productImage.findUnique({ where: { id } })
  if (!image) return { success: false, message: "Image not found" }

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id }, data: { isPrimary: true } }),
  ])

  await auditLog(user.id, "product.image_primary", "product_image", id, `Set as primary image for product ${image.productId}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: "Primary image updated" }
}

export async function reorderImages(ids: string[]) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  for (let i = 0; i < ids.length; i++) {
    await prisma.productImage.update({
      where: { id: ids[i] },
      data: { sortOrder: i },
    })
  }

  await auditLog(user.id, "product.images_reordered", "product_image", ids.join(","), `Reordered ${ids.length} images`)

  return { success: true, message: "Images reordered" }
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, parentId: true, icon: true },
  })
}

export async function getHeaderCategories() {
  const all = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      parentId: true,
    },
  })

  const parents = all.filter((c) => !c.parentId)
  const children = all.filter((c) => c.parentId)

  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    icon: p.icon,
    items: children
      .filter((c) => c.parentId === p.id)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }))
}

export async function getBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logo: true },
  })
}

export async function createBrand(data: { name: string; description?: string; logo?: string }) {
  const user = await requireRole("super_admin", "admin")

  const slug = slugify(data.name)
  const brand = await prisma.brand.create({
    data: { ...data, slug },
  })

  await auditLog(user.id, "brand.created", "brand", brand.id, `Created brand: ${brand.name}`)
  revalidatePath("/admin/dashboard/products")
  revalidatePath("/")

  return { success: true, message: "Brand created", id: brand.id }
}

export async function getProduct(id: string) {
  return getProductById(id)
}

export async function getPublicProducts(options: {
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  pageSize?: number
}) {
  const { search, category, brand, minPrice, maxPrice, sort = "newest", page = 1, pageSize = 12 } = options

  const where: any = { deletedAt: null, status: "Active", isPublished: true }

  if (category) {
    const childIds = await prisma.category.findMany({
      where: { parentId: category, isActive: true },
      select: { id: true },
    })
    const categoryIds = childIds.length > 0
      ? [category, ...childIds.map((c: { id: string }) => c.id)]
      : [category]
    where.categoryId = { in: categoryIds }
  }
  if (brand) where.brand = { slug: brand }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: any =
    sort === "price_asc" ? { price: "asc" as const }
    : sort === "price_desc" ? { price: "desc" as const }
    : sort === "name_asc" ? { name: "asc" as const }
    : sort === "name_desc" ? { name: "desc" as const }
    : { createdAt: "desc" as const }

  const [items, total, distinctBrands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { deletedAt: null, status: "Active", isPublished: true, brandId: { not: null } },
      distinct: ["brandId"],
      include: { brand: { select: { id: true, name: true, slug: true } } },
    }),
  ])

  return {
    items: items.map((p) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      weight: p.weight ? Number(p.weight) : null,
      image: p.images[0]?.url || null,
      reviewCount: p._count.reviews,
    })),
    brands: distinctBrands.map((b) => b.brand).filter(Boolean),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getRelatedProducts(productId: string, categoryId: string | null, take = 4) {
  const where: any = { deletedAt: null, status: "Active", isPublished: true, id: { not: productId } }
  if (categoryId) where.categoryId = categoryId

  const products = await prisma.product.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  })

  return products.map((p) => ({
    ...p,
    price: p.price ? Number(p.price) : null,
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    costPrice: p.costPrice ? Number(p.costPrice) : null,
    weight: p.weight ? Number(p.weight) : null,
  }))
}
