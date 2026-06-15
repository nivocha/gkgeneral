"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function getContactSubmissions(page = 1, pageSize = 20) {
  await requireRole("super_admin", "admin")
  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactSubmission.count(),
  ])
  return { submissions, total, pages: Math.ceil(total / pageSize) }
}

export async function getContactSubmission(id: string) {
  await requireRole("super_admin", "admin")
  return prisma.contactSubmission.findUnique({ where: { id } })
}

export async function markAsRead(id: string) {
  const user = await requireRole("super_admin", "admin")
  await prisma.contactSubmission.update({
    where: { id },
    data: { isRead: true },
  })
  await logAuditEvent({
    userId: user.id,
    action: "CONTACT_MARKED_READ",
    entity: "contactSubmission",
    entityId: id,
    description: "Marked contact submission as read",
  })
  revalidatePath("/admin/dashboard/contact")
  return { success: true }
}

const ReplyNoteSchema = z.object({
  id: z.string().min(1),
  note: z.string().min(1, "Reply note is required"),
})

export async function addReplyNote(id: string, note: string) {
  const user = await requireRole("super_admin", "admin")
  const validated = ReplyNoteSchema.parse({ id, note })
  await prisma.contactSubmission.update({
    where: { id: validated.id },
    data: { replyNote: validated.note, isRead: true },
  })
  await logAuditEvent({
    userId: user.id,
    action: "CONTACT_REPLIED",
    entity: "contactSubmission",
    entityId: id,
    description: "Added reply note to contact submission",
  })
  revalidatePath("/admin/dashboard/contact")
  return { success: true }
}

export async function deleteContactSubmission(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.contactSubmission.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "CONTACT_DELETED",
    entity: "contactSubmission",
    entityId: id,
    description: "Deleted contact submission",
  })

  revalidatePath("/admin/dashboard/contact")
}
