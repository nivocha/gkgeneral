import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import {
  verifyWebhookSignature,
  validateWebhookTimestamp,
} from "@/features/payments/lib/webhook-validator"
import type { WebhookPayload } from "@/features/payments/lib/webhook-validator"
import { assertValidTransition } from "@/features/payments/lib/payment-state-machine"
import { mapEvMakStatusToPaymentStatus } from "@/features/payments/lib/payment-status"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { commitInventoryForOrder, releaseInventoryForOrder } from "@/features/payments/lib/inventory"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import type { PaymentStatus } from "@/lib/prisma"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`webhook:${ip}`, 30, 60_000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  try {
    const rawBody = await request.text()

    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 })
    }

    if (!verifyWebhookSignature(payload)) {
      await logAuditEvent({
        userId: null,
        action: PAYMENT_AUDIT_ACTIONS.WEBHOOK_REJECTED,
        entity: "webhook",
        entityId: null,
        description: "Invalid webhook signature rejected",
        metadata: { event: payload.event, reference: payload.reference },
      })
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 })
    }

    if (!validateWebhookTimestamp(payload.timestamp)) {
      return NextResponse.json({ success: false, message: "Timestamp expired" }, { status: 400 })
    }

    const nonce = payload.nonce
    const existingTx = await prisma.paymentTransaction.findUnique({
      where: { nonce },
    })

    if (existingTx) {
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    await logAuditEvent({
      userId: null,
      action: PAYMENT_AUDIT_ACTIONS.WEBHOOK_VERIFIED,
      entity: "webhook",
      entityId: null,
      description: `Webhook verified: ${payload.event} for ${payload.reference}`,
      metadata: { event: payload.event, reference: payload.reference },
    })

    const payment = await prisma.payment.findFirst({
      where: { reference: payload.reference },
      include: { order: { select: { id: true, orderNumber: true, status: true } } },
    })

    if (!payment) {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 })
    }

    const prismaStatus = mapEvMakStatusToPaymentStatus(payload.status)
    if (!prismaStatus) {
      return NextResponse.json({ success: false, message: `Unknown status: ${payload.status}` }, { status: 400 })
    }

    const currentStatus = payment.status as PaymentStatus
    try {
      assertValidTransition(currentStatus, prismaStatus)
    } catch {
      return NextResponse.json({
        success: false,
        message: `Invalid transition: ${currentStatus} -> ${prismaStatus}`,
      }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: prismaStatus,
        gatewayStatus: payload.gateway_status || payload.status,
        gatewayResponse: payload as Record<string, unknown>,
      }

      if (prismaStatus === "Paid") {
        updateData.paidAt = new Date()
        if (payload.transaction_reference) updateData.transactionReference = payload.transaction_reference
        if (payload.approval_code) updateData.approvalCode = payload.approval_code
        if (payload.card_type) updateData.cardType = payload.card_type
        if (payload.card_masked) updateData.cardMasked = payload.card_masked
        if (payload.payment_id) updateData.paymentId = payload.payment_id
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: updateData as Parameters<typeof tx.payment.update>[0]["data"],
      })

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          status: prismaStatus,
          amount: payment.amount,
          reference: payload.reference,
          nonce,
          externalReference: payload.transaction_reference,
          providerPayload: payload as Record<string, unknown>,
          metadata: JSON.stringify({
            webhookPayload: rawBody,
            event: payload.event,
          }),
        },
      })

      if (prismaStatus === "Paid" && payment.order.status === "Pending") {
        await tx.order.update({
          where: { id: payment.order.id },
          data: { status: "Processing" },
        })
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: "Processing",
            changedBy: null,
            note: "Payment confirmed via webhook",
          },
        })

        await commitInventoryForOrder(tx as any, payment.order.id, payment.order.orderNumber)
      }

      if (prismaStatus === "Refunded") {
        await tx.order.update({
          where: { id: payment.order.id },
          data: { status: "Refunded" },
        })
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: "Refunded",
            changedBy: null,
            note: "Refund confirmed via webhook",
          },
        })

        await releaseInventoryForOrder(tx as any, payment.order.id, payment.order.orderNumber)
      }
    })

    const auditAction = prismaStatus === "Paid"
      ? PAYMENT_AUDIT_ACTIONS.PAYMENT_COMPLETED
      : prismaStatus === "Failed"
        ? PAYMENT_AUDIT_ACTIONS.PAYMENT_FAILED
        : prismaStatus === "Refunded"
          ? PAYMENT_AUDIT_ACTIONS.PAYMENT_REFUNDED
          : prismaStatus === "Cancelled"
            ? PAYMENT_AUDIT_ACTIONS.PAYMENT_CANCELLED
            : PAYMENT_AUDIT_ACTIONS.WEBHOOK_VERIFIED

    await logAuditEvent({
      userId: null,
      action: auditAction,
      entity: "payment",
      entityId: payment.id,
      description: `Payment ${prismaStatus.toLowerCase()} via webhook for order ${payment.order.orderNumber}`,
      metadata: {
        orderId: payment.order.id,
        reference: payload.reference,
        status: prismaStatus,
      },
    })

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[WEBHOOK_ERROR]", message)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
