import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STATUS_CHANGE: "STATUS_CHANGE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
} as const

type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

type LogAuditEventParams = {
  userId: string | null
  action: AuditAction | string
  entity: string
  entityId: string | null
  description?: string
  metadata?: Record<string, unknown>
}

export { AUDIT_ACTIONS }

export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    const h = await headers()
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: h.get("x-forwarded-for") || h.get("x-real-ip") || null,
        userAgent: h.get("user-agent") || null,
      },
    })
  } catch {
    console.error("Failed to create audit log")
  }
}
