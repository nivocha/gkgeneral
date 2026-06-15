"use server"

import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { MnoPaymentSchema } from "@/features/payments/schemas/payment.schema"
import { createMnoPayment, generateMnoReference, verifyMnoPayment } from "@/features/payments/lib/mno"
import type { MnoProvider } from "@/features/payments/lib/mno"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { generateNonce } from "@/features/payments/lib/signature"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"
import { revalidatePath } from "next/cache"

export async function initiateMnoPayment(data: {
  orderId: string
  phoneNumber: string
  provider: MnoProvider
}) {
  const user = await requireAuth()

  const validated = MnoPaymentSchema.parse({
    orderId: data.orderId,
    phoneNumber: data.phoneNumber,
    provider: data.provider,
  })

  const order = await prisma.order.findUnique({
    where: { id: validated.orderId },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      total: true,
      currency: true,
      payment: { select: { id: true, status: true } },
    },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  if (order.userId !== user.id) {
    return { success: false, message: "Forbidden" }
  }

  if (!order.payment) {
    return { success: false, message: "No payment record found" }
  }

  if (order.payment.status !== "Pending") {
    return { success: false, message: `Payment is already ${order.payment.status}` }
  }

  const mnoReference = generateMnoReference()
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/mno-callback`
  const nonce = generateNonce()

  try {
    const mnoResponse = await createMnoPayment({
      provider: validated.provider,
      amount: Number(order.total),
      phoneNumber: validated.phoneNumber,
      reference: mnoReference,
      callbackUrl,
    })

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          reference: mnoReference,
          status: "Processing",
          gatewayStatus: "pending",
          method: validated.provider,
        },
      })

      await tx.paymentTransaction.create({
        data: {
          paymentId: order.payment!.id,
          status: "Processing",
          amount: order.total,
          reference: mnoReference,
          nonce,
          externalReference: mnoResponse.transaction_id,
          providerPayload: mnoResponse as never,
          metadata: JSON.stringify({
            initiatedBy: user.id,
            provider: validated.provider,
            phoneNumber: validated.phoneNumber,
          }),
        },
      })
    })

    await logAuditEvent({
      userId: user.id,
      action: PAYMENT_AUDIT_ACTIONS.MNO_PAYMENT_CREATED,
      entity: "payment",
      entityId: order.payment.id,
      description: `MNO payment initiated for order ${order.orderNumber} via ${validated.provider}`,
      metadata: {
        orderId: order.id,
        reference: mnoReference,
        provider: validated.provider,
        amount: Number(order.total),
      },
    })

    revalidatePath(`/account/orders/${order.id}`)
    revalidatePath(`/admin/dashboard/orders/${order.id}`)

    return {
      success: true,
      message: "MNO payment initiated. Check your phone for payment prompt.",
      data: {
        reference: mnoReference,
        transactionId: mnoResponse.transaction_id,
        paymentId: order.payment.id,
      },
    }
  } catch (error) {
    return { success: false, message: getSafeErrorMessage(error) }
  }
}

export async function checkMnoPaymentStatus(reference: string) {
  const user = await requireAuth()

  try {
    const result = await verifyMnoPayment(reference)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, message: getSafeErrorMessage(error) }
  }
}
