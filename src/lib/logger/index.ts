export { logAuditEvent, AUDIT_ACTIONS } from "./prisma"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function auditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  description?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const h = await headers()
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        description: description ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: h.get("x-forwarded-for") || h.get("x-real-ip") || null,
        userAgent: h.get("user-agent") || null,
      },
    })
  } catch {
    console.error("Failed to create audit log")
  }
}
