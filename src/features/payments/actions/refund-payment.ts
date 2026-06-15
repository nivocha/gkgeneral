"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { RefundPaymentSchema } from "@/features/payments/schemas/payment.schema"
import { assertValidTransition } from "@/features/payments/lib/payment-state-machine"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { releaseInventoryForOrder } from "@/features/payments/lib/inventory"
import { generateNonce } from "@/features/payments/lib/signature"
import { revalidatePath } from "next/cache"
import type { PaymentStatus } from "@/lib/prisma"

export async function refundPayment(
  paymentId: string,
  reason?: string,
  amount?: number
) {
  const user = await requireRole("super_admin", "admin")

  const validated = RefundPaymentSchema.parse({ paymentId, reason, amount })

  const payment = await prisma.payment.findUnique({
    where: { id: validated.paymentId },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  })

  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  const currentStatus = payment.status as PaymentStatus
  try {
    assertValidTransition(currentStatus, "Refunded")
  } catch {
    return { success: false, message: `Cannot refund payment with status ${payment.status}` }
  }

  if (!payment.reference) {
    return { success: false, message: "Payment has no external reference" }
  }

  const refundAmount = validated.amount ?? Number(payment.amount)

  let evmakResponse: Awaited<ReturnType<typeof evmakClient.refundPayment>>
  try {
    evmakResponse = await evmakClient.refundPayment(
      payment.reference,
      refundAmount
    )
  } catch (error) {
    return { success: false, message: getSafeErrorMessage(error) }
  }

  const nonce = generateNonce()

  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {
      status: "Refunded",
      gatewayStatus: "refunded",
    }
    if (evmakResponse.transactionReference) {
      updateData.transactionReference = evmakResponse.transactionReference
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: updateData as Parameters<typeof tx.payment.update>[0]["data"],
    })

    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: "Refunded",
        amount: refundAmount,
        reference: payment.reference,
        nonce,
        externalReference: evmakResponse.transactionReference,
        providerPayload: evmakResponse as Record<string, unknown>,
        metadata: JSON.stringify({
          refundedBy: user.id,
          reason: validated.reason ?? null,
          refundAmount,
        }),
      },
    })

    await tx.order.update({
      where: { id: payment.order.id },
      data: { status: "Refunded" },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: payment.order.id,
        status: "Refunded",
        changedBy: user.id,
        note: validated.reason ?? "Refund processed",
      },
    })

    await releaseInventoryForOrder(tx as any, payment.order.id, payment.order.orderNumber)
  })

  await logAuditEvent({
    userId: user.id,
    action: PAYMENT_AUDIT_ACTIONS.PAYMENT_REFUNDED,
    entity: "payment",
    entityId: payment.id,
    description: `Payment refunded for order ${payment.order.orderNumber}`,
    metadata: {
      orderId: payment.order.id,
      reference: payment.reference,
      amount: refundAmount,
      reason: validated.reason,
    },
  })

  revalidatePath(`/admin/dashboard/payments/${payment.id}`)
  revalidatePath(`/admin/dashboard/orders/${payment.order.id}`)
  revalidatePath(`/account/orders/${payment.order.id}`)
  revalidatePath(`/account/payments/${payment.id}`)

  return {
    success: true,
    message: "Payment refunded successfully",
    data: { status: "Refunded" as const },
  }
}
