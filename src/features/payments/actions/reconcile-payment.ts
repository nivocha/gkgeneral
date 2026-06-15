"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"
import { isPaymentsConfigured } from "@/lib/env"
import { revalidatePath } from "next/cache"

export type ReconciliationResult = {
  localStatus: string
  providerStatus: string
  matched: boolean
  repaired: boolean
  providerData: Record<string, unknown> | null
}

export async function reconcilePayment(reference: string) {
  const user = await requireRole("super_admin", "admin", "finance_manager")

  if (!reference) {
    return { success: false, message: "Reference is required" }
  }

  if (!isPaymentsConfigured()) {
    return { success: false, message: "Payment provider not configured" }
  }

  const payment = await prisma.payment.findFirst({
    where: { reference },
    include: { order: { select: { id: true, orderNumber: true } } },
  })

  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: PAYMENT_AUDIT_ACTIONS.RECONCILIATION_STARTED,
    entity: "payment",
    entityId: payment.id,
    description: `Reconciliation started for ${reference}`,
    metadata: { reference, localStatus: payment.status },
  })

  let providerData: Awaited<ReturnType<typeof evmakClient.reconcilePayment>>
  try {
    providerData = await evmakClient.reconcilePayment(reference)
  } catch (error) {
    return {
      success: false,
      message: getSafeErrorMessage(error),
      data: null,
    }
  }

  const localStatus = payment.status
  const providerStatus = providerData.status
  const matched = localStatus.toLowerCase() === providerStatus.toLowerCase()

  let repaired = false

  if (!matched) {
    const prismaStatus = providerStatus === "completed" ? "Paid"
      : providerStatus === "failed" ? "Failed"
      : providerStatus === "refunded" ? "Refunded"
      : providerStatus === "cancelled" ? "Cancelled"
      : null

    if (prismaStatus) {
      await prisma.$transaction(async (tx) => {
        const updateData: Record<string, unknown> = {
          status: prismaStatus,
          gatewayStatus: providerStatus,
          gatewayResponse: providerData as Record<string, unknown>,
        }
        if (prismaStatus === "Paid" && !payment.paidAt) {
          updateData.paidAt = providerData.paidAt ? new Date(providerData.paidAt) : new Date()
        }
        if (providerData.approvalCode) updateData.approvalCode = providerData.approvalCode
        if (providerData.transactionReference) updateData.transactionReference = providerData.transactionReference
        if (providerData.paymentId) updateData.paymentId = providerData.paymentId

        await tx.payment.update({
          where: { id: payment.id },
          data: updateData as Parameters<typeof tx.payment.update>[0]["data"],
        })

        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            status: "Paid",
            amount: payment.amount,
            reference: payment.reference,
            externalReference: providerData.transactionReference,
            providerPayload: providerData as Record<string, unknown>,
            metadata: JSON.stringify({
              reconciledBy: user.id,
              previousStatus: localStatus,
              providerStatus,
            }),
          },
        })
      })

      repaired = true
    }
  }

  const result: ReconciliationResult = {
    localStatus,
    providerStatus,
    matched,
    repaired,
    providerData: providerData as unknown as Record<string, unknown>,
  }

  const auditAction = matched
    ? PAYMENT_AUDIT_ACTIONS.RECONCILIATION_COMPLETED
    : repaired
      ? PAYMENT_AUDIT_ACTIONS.RECONCILIATION_REPAIRED
      : PAYMENT_AUDIT_ACTIONS.RECONCILIATION_MISMATCH

  await logAuditEvent({
    userId: user.id,
    action: auditAction,
    entity: "payment",
    entityId: payment.id,
    description: matched
      ? `Reconciliation OK for ${reference}`
      : repaired
        ? `Reconciliation repaired: ${localStatus} -> ${providerStatus}`
        : `Reconciliation mismatch: local=${localStatus}, provider=${providerStatus}`,
    metadata: { reference, localStatus, providerStatus, matched, repaired },
  })

  revalidatePath(`/admin/dashboard/payments/${payment.id}`)

  return { success: true, data: result }
}
