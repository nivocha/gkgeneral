"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { HeroBannerSchema, type HeroBannerInput } from "@/features/homepage/lib/homepage-content-types"
import { revalidatePath } from "next/cache"

export async function getHeroBanners() {
  return prisma.heroBanner.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function getHeroBanner(id: string) {
  return prisma.heroBanner.findUnique({ where: { id } })
}

export async function createHeroBanner(data: HeroBannerInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = HeroBannerSchema.parse(data)

  const banner = await prisma.heroBanner.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "HERO_BANNER_CREATED",
    entity: "hero_banner",
    entityId: banner.id,
    description: `Created hero banner: ${banner.title}`,
    metadata: { title: banner.title },
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/banners")
  return { success: true, banner }
}

export async function updateHeroBanner(id: string, data: Partial<HeroBannerInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = HeroBannerSchema.partial().parse(data)

  const banner = await prisma.heroBanner.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "HERO_BANNER_UPDATED",
    entity: "hero_banner",
    entityId: banner.id,
    description: `Updated hero banner: ${banner.title}`,
    metadata: { title: banner.title },
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/banners")
  return { success: true, banner }
}

export async function deleteHeroBanner(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.heroBanner.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "HERO_BANNER_DELETED",
    entity: "hero_banner",
    entityId: id,
    description: `Deleted hero banner`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/banners")
}
