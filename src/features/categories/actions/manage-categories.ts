"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type CategoryInput = z.infer<typeof CategorySchema>

export async function getAdminCategories() {
  await requireRole("super_admin", "admin", "sales_manager")
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, products: true } },
    },
  })
}

export async function getAdminCategory(id: string) {
  await requireRole("super_admin", "admin", "sales_manager")
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, products: true } },
    },
  })
}

export async function createCategory(data: CategoryInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = CategorySchema.parse(data)

  const category = await prisma.category.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "CATEGORY_CREATED",
    entity: "category",
    entityId: category.id,
    description: `Created category: ${category.name}`,
  })

  revalidatePath("/admin/dashboard/categories")
  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true, category }
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = CategorySchema.partial().parse(data)

  const category = await prisma.category.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "CATEGORY_UPDATED",
    entity: "category",
    entityId: category.id,
    description: `Updated category: ${category.name}`,
  })

  revalidatePath("/admin/dashboard/categories")
  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true, category }
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.category.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "CATEGORY_DELETED",
    entity: "category",
    entityId: id,
    description: `Deleted category`,
  })

  revalidatePath("/admin/dashboard/categories")
  revalidatePath("/categories")
  revalidatePath("/")
}
