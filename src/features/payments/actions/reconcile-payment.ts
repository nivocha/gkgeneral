"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { mapEvMakStatusToPaymentStatus } from "@/features/payments/lib/payment-status"
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

  let providerResponse: Awaited<ReturnType<typeof evmakClient.reconcilePayment>>
  try {
    providerResponse = await evmakClient.reconcilePayment(reference)
  } catch (error) {
    return {
      success: false,
      message: getSafeErrorMessage(error),
      data: null,
    }
  }

  if (providerResponse.status !== "success" || !providerResponse.data) {
    return {
      success: false,
      message: providerResponse.message || "Provider returned error",
      data: null,
    }
  }

  const txData = providerResponse.data
  const localStatus = payment.status
  const txStatus = txData.status
  const providerStatus = mapEvMakStatusToPaymentStatus(txStatus)
  const matched = localStatus === providerStatus

  let repaired = false

  if (!matched && providerStatus) {
    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: providerStatus,
        gatewayStatus: txStatus,
        gatewayResponse: providerResponse as never,
      }
      if (providerStatus === "Paid" && !payment.paidAt) {
        updateData.paidAt = txData.authorized_at ? new Date(txData.authorized_at) : new Date()
      }
      if (txData.approval_code) updateData.approvalCode = txData.approval_code
      if (txData.payment_id) updateData.transactionReference = txData.payment_id

      await tx.payment.update({
        where: { id: payment.id },
        data: updateData as Parameters<typeof tx.payment.update>[0]["data"],
      })

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          status: providerStatus,
          amount: payment.amount,
          reference: payment.reference,
          externalReference: txData.payment_id,
          providerPayload: providerResponse as never,
          metadata: JSON.stringify({
            reconciledBy: user.id,
            previousStatus: localStatus,
            providerStatus: txStatus,
          }),
        },
      })
    })

    repaired = true
  }

  const result: ReconciliationResult = {
    localStatus,
    providerStatus: txStatus,
    matched,
    repaired,
    providerData: providerResponse as unknown as never,
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
        ? `Reconciliation repaired: ${localStatus} -> ${txStatus}`
        : `Reconciliation mismatch: local=${localStatus}, provider=${txStatus}`,
    metadata: { reference, localStatus, providerStatus: txStatus, matched, repaired },
  })

  revalidatePath(`/admin/dashboard/payments/${payment.id}`)

  return { success: true, data: result }
}
