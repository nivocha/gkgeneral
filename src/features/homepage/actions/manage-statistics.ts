"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { SiteStatisticSchema, type SiteStatisticInput } from "@/features/homepage/lib/homepage-content-types"
import { revalidatePath } from "next/cache"

export async function getSiteStatistics() {
  return prisma.siteStatistic.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function getSiteStatistic(id: string) {
  return prisma.siteStatistic.findUnique({ where: { id } })
}

export async function createSiteStatistic(data: SiteStatisticInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = SiteStatisticSchema.parse(data)

  const stat = await prisma.siteStatistic.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "SITE_STATISTIC_CREATED",
    entity: "site_statistic",
    entityId: stat.id,
    description: `Created statistic: ${stat.label}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/statistics")
  return { success: true, stat }
}

export async function updateSiteStatistic(id: string, data: Partial<SiteStatisticInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = SiteStatisticSchema.partial().parse(data)

  const stat = await prisma.siteStatistic.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "SITE_STATISTIC_UPDATED",
    entity: "site_statistic",
    entityId: stat.id,
    description: `Updated statistic: ${stat.label}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/statistics")
  return { success: true, stat }
}

export async function deleteSiteStatistic(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.siteStatistic.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "SITE_STATISTIC_DELETED",
    entity: "site_statistic",
    entityId: id,
    description: `Deleted statistic`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/statistics")
}
