"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"
import { CmsPageSchema, type CmsPageInput } from "@/features/cms/lib/cms-types"

export async function getCmsPage(slug: string) {
  return prisma.cmsPage.findUnique({
    where: { slug, isActive: true },
  })
}

export async function getCmsPages() {
  return prisma.cmsPage.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
  })
}

export async function getAdminCmsPages() {
  await requireRole("super_admin", "admin")
  return prisma.cmsPage.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminCmsPage(id: string) {
  await requireRole("super_admin", "admin")
  return prisma.cmsPage.findUnique({ where: { id } })
}

export async function createCmsPage(data: CmsPageInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = CmsPageSchema.parse(data)

  const page = await prisma.cmsPage.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "CMS_PAGE_CREATED",
    entity: "cmsPage",
    entityId: page.id,
    description: `Created CMS page: ${page.title}`,
  })

  revalidatePath("/admin/dashboard/cms/pages")
  revalidatePath(`/${page.slug}`)
  return { success: true, page }
}

export async function updateCmsPage(id: string, data: Partial<CmsPageInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = CmsPageSchema.partial().parse(data)

  const page = await prisma.cmsPage.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "CMS_PAGE_UPDATED",
    entity: "cmsPage",
    entityId: page.id,
    description: `Updated CMS page: ${page.title}`,
  })

  revalidatePath("/admin/dashboard/cms/pages")
  revalidatePath(`/${page.slug}`)
  return { success: true, page }
}

export async function deleteCmsPage(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  const page = await prisma.cmsPage.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "CMS_PAGE_DELETED",
    entity: "cmsPage",
    entityId: id,
    description: `Deleted CMS page: ${page.title}`,
  })

  revalidatePath("/admin/dashboard/cms/pages")
  revalidatePath(`/${page.slug}`)
}
