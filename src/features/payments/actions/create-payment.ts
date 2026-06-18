"use server"

import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { InitializePaymentSchema } from "@/features/payments/schemas/payment.schema"
import { isPaymentsConfigured } from "@/lib/env"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { generateNonce } from "@/features/payments/lib/signature"
import { revalidatePath } from "next/cache"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"

export async function initiatePayment(
  orderId: string,
  billingAddress?: {
    street: string
    city: string
    state?: string | null
    zipCode?: string | null
    country: string
  }
) {
  const user = await requireAuth()

  const { orderId: validatedOrderId } = InitializePaymentSchema.parse({ orderId })

  const order = await prisma.order.findUnique({
    where: { id: validatedOrderId },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      total: true,
      currency: true,
      user: { select: { email: true, phone: true } },
      payment: { select: { id: true, status: true, gatewayStatus: true } },
    },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  if (order.userId !== user.id) {
    return { success: false, message: "Forbidden" }
  }

  if (!order.payment) {
    return { success: false, message: "No payment record found for this order" }
  }

  if (order.payment.status === "Paid" || order.payment.status === "Refunded") {
    return { success: false, message: `Payment is already ${order.payment.status}` }
  }
  if (order.payment.status === "Processing") {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: "Pending", gatewayStatus: "pending" },
    })
  }

  if (!isPaymentsConfigured()) {
    await logAuditEvent({
      userId: user.id,
      action: PAYMENT_AUDIT_ACTIONS.PAYMENT_PENDING,
      entity: "payment",
      entityId: order.payment.id,
      description: `Payment pending for order ${order.orderNumber} — online payment not configured`,
      metadata: { orderId: order.id, amount: Number(order.total), paymentMode: "manual" },
    })

    revalidatePath(`/account/orders/${order.id}`)
    revalidatePath(`/admin/dashboard/orders/${order.id}`)

    return {
      success: true,
      message: "Payment recorded as pending. You will be contacted for payment.",
      data: { paymentUrl: null, reference: null, paymentId: order.payment.id },
    }
  }

  const orderFull = await prisma.order.findUnique({
    where: { id: order.id },
    select: { orderNumber: true },
  })

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/callback`
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/orders/${order.id}`
  const returnUrl = `${callbackUrl}?reference=${orderFull?.orderNumber || order.id}`

  const nameParts = (user.name || "").split(/\s+/)

  let evmakResponse: Awaited<ReturnType<typeof evmakClient.initializePayment>>
  try {
    evmakResponse = await evmakClient.initializePayment({
      orderId: order.id,
      orderNumber: orderFull?.orderNumber || order.id,
      amount: Number(order.total),
      currency: order.currency,
      callbackUrl,
      returnUrl,
      cancelUrl,
      customerFirstName: nameParts[0] || "",
      customerLastName: nameParts.slice(1).join(" ") || "",
      customerEmail: order.user.email,
      customerPhone: order.user.phone || undefined,
      billingAddress,
    })
  } catch (error) {
    return {
      success: false,
      message: getSafeErrorMessage(error),
    }
  }

  const nonce = generateNonce()

  const updatedPayment = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: {
        reference: evmakResponse.reference,
        status: "Processing",
        gatewayStatus: "processing",
      },
    })

    await tx.paymentTransaction.create({
      data: {
        paymentId: order.payment!.id,
        status: "Processing",
        amount: order.total,
        reference: evmakResponse.reference,
        nonce,
        providerPayload: evmakResponse as never,
        metadata: JSON.stringify({ initiatedBy: user.id }),
      },
    })

    return tx.payment.findUnique({ where: { id: order.payment!.id } })
  })

  await logAuditEvent({
    userId: user.id,
    action: PAYMENT_AUDIT_ACTIONS.PAYMENT_PENDING,
    entity: "payment",
    entityId: order.payment.id,
    description: `Online payment initiated for order ${order.orderNumber}`,
    metadata: {
      orderId: order.id,
      reference: evmakResponse.reference,
      amount: Number(order.total),
      paymentMode: "online",
    },
  })

  revalidatePath(`/account/orders/${order.id}`)
  revalidatePath(`/admin/dashboard/orders/${order.id}`)

  return {
    success: true,
    message: "Payment initiated",
    data: {
      paymentUrl: evmakResponse.paymentUrl,
      reference: evmakResponse.reference,
      paymentId: updatedPayment?.id,
    },
  }
}
