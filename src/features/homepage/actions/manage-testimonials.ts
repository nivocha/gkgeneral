"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { TestimonialSchema, type TestimonialInput } from "@/features/homepage/lib/homepage-content-types"
import { revalidatePath } from "next/cache"

export async function getTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function getTestimonial(id: string) {
  return prisma.testimonial.findUnique({ where: { id } })
}

export async function createTestimonial(data: TestimonialInput) {
  const user = await requireRole("super_admin", "admin")
  const validated = TestimonialSchema.parse(data)

  const testimonial = await prisma.testimonial.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "TESTIMONIAL_CREATED",
    entity: "testimonial",
    entityId: testimonial.id,
    description: `Created testimonial by ${testimonial.name}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/testimonials")
  return { success: true, testimonial }
}

export async function updateTestimonial(id: string, data: Partial<TestimonialInput>) {
  const user = await requireRole("super_admin", "admin")
  const validated = TestimonialSchema.partial().parse(data)

  const testimonial = await prisma.testimonial.update({ where: { id }, data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "TESTIMONIAL_UPDATED",
    entity: "testimonial",
    entityId: testimonial.id,
    description: `Updated testimonial by ${testimonial.name}`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/testimonials")
  return { success: true, testimonial }
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.testimonial.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "TESTIMONIAL_DELETED",
    entity: "testimonial",
    entityId: id,
    description: `Deleted testimonial`,
  })

  revalidatePath("/")
  revalidatePath("/admin/dashboard/cms/testimonials")
}
