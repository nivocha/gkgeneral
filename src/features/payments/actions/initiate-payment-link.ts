"use server"

import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { evmakClient } from "@/features/payments/lib/evmak-client"
import { isPaymentsConfigured } from "@/lib/env"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { generateNonce } from "@/features/payments/lib/signature"
import { createMnoPayment, generateMnoReference } from "@/features/payments/lib/mno"
import { revalidatePath } from "next/cache"
import { getSafeErrorMessage } from "@/features/payments/lib/errors"
import { getBaseUrl } from "@/lib/utils"

export async function initiatePaymentLinkPayment(
  token: string,
  options?: { method?: string; mnoProvider?: string; amount?: number }
) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          user: { select: { email: true, phone: true } },
          payment: { select: { id: true, status: true, gatewayStatus: true } },
        },
      },
    },
  })

  if (!link) return { success: false, message: "Invalid payment link" }
  if (link.status !== "Active") return { success: false, message: "Payment link is no longer active" }
  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.paymentLink.update({ where: { id: link.id }, data: { status: "Expired" } })
    return { success: false, message: "Payment link has expired" }
  }

  let order = link.order
  let payment = order.payment

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: "payment_link",
        status: "Pending",
      },
    })
  }
  if (payment.status === "Paid" || payment.status === "Refunded") {
    return { success: false, message: `Payment is already ${payment.status}` }
  }
  if (payment.status === "Processing") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "Pending", gatewayStatus: "pending" },
    })
    payment.status = "Pending"
  }

  if (!isPaymentsConfigured()) {
    await logAuditEvent({
      userId: link.id,
      action: PAYMENT_AUDIT_ACTIONS.PAYMENT_PENDING,
      entity: "PaymentLink",
      entityId: link.id,
      description: `Payment via link pending for order ${order.id} — gateway not configured`,
    })
    return { success: false, message: "Online payment is not configured" }
  }

  const method = options?.method || "credit_card"
  const payAmount = options?.amount !== undefined ? Number(options.amount) : Number(order.total)

  if (payAmount <= 0) return { success: false, message: "Invalid payment amount" }

  if (method === "mobile_money") {
    if (!link.customerPhone) {
      return { success: false, message: "Phone number is required for mobile money" }
    }
    const mnoRef = generateMnoReference()
    const mnoCallbackUrl = `${getBaseUrl()}/api/payments/mno-callback`
    const mnoProvider = (options?.mnoProvider as "mpesa" | "tigo_pesa" | "airtel_money" | "halopesa") || "mpesa"

    let mnoResponse
    try {
      mnoResponse = await createMnoPayment({
        provider: mnoProvider,
        amount: payAmount,
        phoneNumber: link.customerPhone,
        reference: mnoRef,
        callbackUrl: mnoCallbackUrl,
      })
    } catch (error) {
      return { success: false, message: getSafeErrorMessage(error) }
    }

    if (!mnoResponse.success) {
      return { success: false, message: mnoResponse.message || "Mobile money payment failed" }
    }

    const nonce = generateNonce()

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          reference: mnoRef,
          amount: payAmount,
          status: "Processing",
          gatewayStatus: "processing",
          gatewayResponse: { mnoProvider, mnoResponse } as never,
        },
      })
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          status: "Processing",
          amount: payAmount,
          reference: mnoRef,
          nonce,
          providerPayload: mnoResponse as never,
          metadata: JSON.stringify({
            initiatedBy: "payment_link",
            linkToken: token,
            mnoProvider,
            mnoTransactionId: mnoResponse.transaction_id,
          }),
        },
      })
    })

    await logAuditEvent({
      userId: link.id,
      action: PAYMENT_AUDIT_ACTIONS.PAYMENT_PENDING,
      entity: "PaymentLink",
      entityId: link.id,
      description: `MNO payment initiated via link for order ${order.orderNumber} (${mnoProvider})`,
      metadata: { reference: mnoRef, token, mnoProvider },
    })

    revalidatePath(`/pay/${token}`)

    return {
      success: true,
      message: `Check your phone for ${mnoProvider} payment prompt`,
      data: { reference: mnoRef },
    }
  }

  const callbackUrl = `${getBaseUrl()}/api/payments/callback`
  const cancelUrl = `${getBaseUrl()}/pay/${token}`

  const customerName = (link.customerName || "").split(/\s+/)

  let evmakResponse: Awaited<ReturnType<typeof evmakClient.initializePayment>>
  try {
    evmakResponse = await evmakClient.initializePayment({
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
      amount: payAmount,
      currency: order.currency,
      callbackUrl,
      cancelUrl,
      customerFirstName: customerName[0] || "",
      customerLastName: customerName.slice(1).join(" ") || "",
      customerEmail: link.customerEmail || "",
      customerPhone: link.customerPhone || undefined,
      billingAddress: (link.customerAddress ?? undefined) as never,
    })
  } catch (error) {
    return { success: false, message: getSafeErrorMessage(error) }
  }

  const nonce = generateNonce()

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        reference: evmakResponse.reference,
        amount: payAmount,
        status: "Processing",
        gatewayStatus: "processing",
      },
    })
    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: "Processing",
        amount: payAmount,
        reference: evmakResponse.reference,
        nonce,
        providerPayload: evmakResponse as never,
        metadata: JSON.stringify({ initiatedBy: "payment_link", linkToken: token }),
      },
    })
  })

  await logAuditEvent({
    userId: link.id,
    action: PAYMENT_AUDIT_ACTIONS.PAYMENT_PENDING,
    entity: "PaymentLink",
    entityId: link.id,
    description: `Payment initiated via link for order ${order.orderNumber}`,
    metadata: { reference: evmakResponse.reference, token },
  })

  revalidatePath(`/pay/${token}`)

  return {
    success: true,
    message: "Payment initiated",
    data: {
      paymentUrl: evmakResponse.paymentUrl,
      reference: evmakResponse.reference,
    },
  }
}
