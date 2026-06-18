"use server"

import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { VerifyPaymentSchema } from "@/features/payments/schemas/payment.schema"
import { assertValidTransition } from "@/features/payments/lib/payment-state-machine"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"
import { mapEvMakStatusToPaymentStatus } from "@/features/payments/lib/payment-status"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { commitInventoryForOrder } from "@/features/payments/lib/inventory"
import { generateNonce } from "@/features/payments/lib/signature"
import { revalidatePath } from "next/cache"
import type { PaymentStatus } from "@/lib/prisma"

export async function verifyPayment(paymentId: string) {
  const user = await requireAuth()

  const { paymentId: validatedId } = VerifyPaymentSchema.parse({ paymentId })

  const payment = await prisma.payment.findUnique({
    where: { id: validatedId },
    include: {
      order: { select: { id: true, orderNumber: true, userId: true, status: true } },
    },
  })

  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  if (payment.order.userId !== user.id) {
    return { success: false, message: "Forbidden" }
  }

  if (!payment.reference) {
    return { success: false, message: "Payment has not been initialized" }
  }

  let evmakResponse: Awaited<ReturnType<typeof evmakClient.verifyPayment>>
  try {
    evmakResponse = await evmakClient.verifyPayment(payment.reference)
  } catch (error) {
    return { success: false, message: getSafeErrorMessage(error) }
  }

  if (evmakResponse.status !== "success" || !evmakResponse.data) {
    return { success: false, message: evmakResponse.message || "Failed to verify payment status" }
  }

  const txData = evmakResponse.data
  const newStatus = mapEvMakStatusToPaymentStatus(txData.status)
  if (!newStatus) {
    return { success: false, message: `Unknown payment status: ${txData.status}` }
  }

  const currentStatus = payment.status as PaymentStatus
  try {
    assertValidTransition(currentStatus, newStatus)
  } catch {
    return { success: false, message: `Cannot transition from ${currentStatus} to ${newStatus}` }
  }

  const nonce = generateNonce()

  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {
      status: newStatus,
      gatewayStatus: txData.status,
    }

    if (newStatus === "Paid") {
      updateData.paidAt = txData.authorized_at ? new Date(txData.authorized_at) : new Date()
      if (txData.payment_id) updateData.transactionReference = txData.payment_id
      if (txData.approval_code) updateData.approvalCode = txData.approval_code
      if (txData.card_type) updateData.cardType = txData.card_type
      if (txData.card_number) updateData.cardMasked = txData.card_number
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: updateData as Parameters<typeof tx.payment.update>[0]["data"],
    })

    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: newStatus,
        amount: payment.amount,
        reference: payment.reference,
        nonce,
        externalReference: txData.payment_id,
        providerPayload: evmakResponse as never,
        metadata: JSON.stringify({ verifiedBy: user.id }),
      },
    })

    if (newStatus === "Paid") {
      const nextOrderStatus = payment.order.status === "Pending" ? "Processing" : "Paid"
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: nextOrderStatus },
      })
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.order.id,
          status: nextOrderStatus,
          changedBy: user.id,
          note: "Payment verified",
        },
      })

      await commitInventoryForOrder(tx as any, payment.order.id, payment.order.orderNumber)
    }
  })

  const auditAction = newStatus === "Paid"
    ? PAYMENT_AUDIT_ACTIONS.PAYMENT_COMPLETED
    : PAYMENT_AUDIT_ACTIONS.PAYMENT_FAILED

  await logAuditEvent({
    userId: user.id,
    action: auditAction,
    entity: "payment",
    entityId: payment.id,
    description: `Payment ${newStatus.toLowerCase()} for order ${payment.order.orderNumber}`,
    metadata: { orderId: payment.order.id, reference: payment.reference, status: newStatus },
  })

  revalidatePath(`/account/orders/${payment.order.id}`)
  revalidatePath(`/admin/dashboard/orders/${payment.order.id}`)
  revalidatePath(`/account/payments/${payment.id}`)
  revalidatePath(`/admin/dashboard/payments/${payment.id}`)

  return {
    success: true,
    message: `Payment ${newStatus.toLowerCase()}`,
    data: { status: newStatus },
  }
}
