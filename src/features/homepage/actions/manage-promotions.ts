"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { PromotionBannerSchema, type PromotionBannerInput } from "@/features/homepage/lib/homepage-content-types"
import { revalidatePath } from "next/cache"

export async function getPromotionBanners() {
  return prisma.promotionBanner.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function getPromotionBanner(id: string) {
  return prisma.promotionBanner.findUnique({ where: { id } })
}

export async function createPromotionBanner(data: PromotionBannerInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = PromotionBannerSchema.parse(data)

  const banner = await prisma.promotionBanner.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "PROMOTION_BANNER_CREATED",
    entity: "promotion_banner",
    entityId: banner.id,
    description: `Created promotion: ${banner.title}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/promotions")
  return { success: true, banner }
}

export async function updatePromotionBanner(id: string, data: Partial<PromotionBannerInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = PromotionBannerSchema.partial().parse(data)

  const banner = await prisma.promotionBanner.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "PROMOTION_BANNER_UPDATED",
    entity: "promotion_banner",
    entityId: banner.id,
    description: `Updated promotion: ${banner.title}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/promotions")
  return { success: true, banner }
}

export async function deletePromotionBanner(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.promotionBanner.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "PROMOTION_BANNER_DELETED",
    entity: "promotion_banner",
    entityId: id,
    description: `Deleted promotion banner`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/promotions")
}
