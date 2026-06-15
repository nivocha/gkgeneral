"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const BrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type BrandInput = z.infer<typeof BrandSchema>

export async function getBrands(search?: string, page = 1, pageSize = 20) {
  await requireRole("super_admin", "admin")
  const where = {
    deletedAt: null,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  }
  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.count({ where }),
  ])
  return { brands, total, pages: Math.ceil(total / pageSize) }
}

export async function getBrand(id: string) {
  await requireRole("super_admin", "admin")
  return prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
}

export async function createBrand(data: BrandInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = BrandSchema.parse(data)

  const brand = await prisma.brand.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "BRAND_CREATED",
    entity: "brand",
    entityId: brand.id,
    description: `Created brand: ${brand.name}`,
  })

  revalidatePath("/admin/dashboard/brands")
  return { success: true, brand }
}

export async function updateBrand(id: string, data: Partial<BrandInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = BrandSchema.partial().parse(data)

  const brand = await prisma.brand.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "BRAND_UPDATED",
    entity: "brand",
    entityId: brand.id,
    description: `Updated brand: ${brand.name}`,
  })

  revalidatePath("/admin/dashboard/brands")
  return { success: true, brand }
}

export async function deleteBrand(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  const brand = await prisma.brand.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAuditEvent({
    userId: user.id,
    action: "BRAND_DELETED",
    entity: "brand",
    entityId: id,
    description: `Soft-deleted brand: ${brand.name}`,
  })

  revalidatePath("/admin/dashboard/brands")
}

export async function restoreBrand(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  const brand = await prisma.brand.update({
    where: { id },
    data: { deletedAt: null },
  })

  await logAuditEvent({
    userId: user.id,
    action: "BRAND_RESTORED",
    entity: "brand",
    entityId: id,
    description: `Restored brand: ${brand.name}`,
  })

  revalidatePath("/admin/dashboard/brands")
}
