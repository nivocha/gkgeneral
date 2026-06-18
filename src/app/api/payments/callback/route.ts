import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { assertValidTransition } from "@/features/payments/lib/payment-state-machine"
import { mapEvMakStatusToPaymentStatus } from "@/features/payments/lib/payment-status"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { commitInventoryForOrder, releaseInventoryForOrder } from "@/features/payments/lib/inventory"
import { getBaseUrl } from "@/lib/utils"
import type { PaymentStatus } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference") || searchParams.get("transaction_reference")
  const token = searchParams.get("token")
  const baseUrl = getBaseUrl()

  let payment = null
  if (reference) {
    payment = await prisma.payment.findFirst({
      where: { reference },
      include: { order: { select: { id: true, orderNumber: true } } },
    })
  }

  if (!payment && token) {
    const link = await prisma.paymentLink.findUnique({
      where: { token },
      include: { order: { include: { payment: true } } },
    })
    if (link?.order?.payment) {
      payment = { ...link.order.payment, order: { id: link.order.id, orderNumber: link.order.orderNumber } } as any
    }
  }

  if (!payment) {
    payment = await prisma.payment.findFirst({
      where: { status: "Processing" },
      orderBy: { updatedAt: "desc" },
      include: { order: { select: { id: true, orderNumber: true } } },
    })
  }

  let reconciled = false
  if (payment && (payment.status === "Processing" || payment.status === "Pending")) {
    try {
      const { evmakClient } = await import("@/features/payments/lib/evmak-client")
      const result = await evmakClient.reconcilePayment(payment.reference || payment.id)
      if (result.status === "success" && result.data?.status) {
        const txStatus = result.data.status
        const newStatus = mapEvMakStatusToPaymentStatus(txStatus)
        if (newStatus && newStatus !== payment.status) {
          assertValidTransition(payment.status as PaymentStatus, newStatus)
          const txData = result.data!
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                gatewayStatus: txStatus,
                ...(txData.payment_id ? { transactionReference: txData.payment_id } : {}),
                ...(txData.approval_code ? { approvalCode: txData.approval_code } : {}),
                ...(newStatus === "Paid" ? { paidAt: txData.authorized_at ? new Date(txData.authorized_at) : new Date() } : {}),
              },
            })
            await tx.paymentTransaction.create({
              data: {
                paymentId: payment.id,
                status: newStatus,
                amount: payment.amount,
                reference: payment.reference || payment.id,
                externalReference: txData.payment_id,
                providerPayload: result as never,
                metadata: JSON.stringify({
                  source: "callback_get",
                  evmakStatus: txStatus,
                }),
              },
            })
            if (newStatus === "Paid") {
              await tx.order.update({
                where: { id: payment.orderId },
                data: { status: "Paid" },
              })
              await tx.orderStatusHistory.create({
                data: {
                  orderId: payment.orderId,
                  status: "Paid",
                  changedBy: null,
                  note: "Payment confirmed via EvMak reconciliation",
                },
              })
            }
          })
          payment.status = newStatus as any
          reconciled = true
        }
      }
    } catch {
      console.error("[CALLBACK_GET] reconciliation failed for", payment.reference)
    }
  }

  let redirectUrl = `${baseUrl}/`
  if (payment) {
    const link = await prisma.paymentLink.findFirst({ where: { orderId: payment.orderId } })
    if (link) redirectUrl = `${baseUrl}/pay/${link.token}/success`
    else redirectUrl = `${baseUrl}/account/orders`
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting...</title></head>
<body>
<script>
  var dest = ${JSON.stringify(redirectUrl)};
  if (window.top && window.top !== window.self) {
    window.top.location.href = dest;
  } else {
    window.location.href = dest;
  }
<\/script>
<noscript><meta http-equiv="refresh" content="0;url='${redirectUrl}'"></noscript>
<p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a></p>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  )
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 })
    }

    const reference = (payload.transaction_reference as string) || ""

    if (!reference) {
      return NextResponse.json({ success: false, message: "Missing transaction_reference" }, { status: 400 })
    }

    const evmakStatus = (payload.status as string) || ""
    const prismaStatus = mapEvMakStatusToPaymentStatus(evmakStatus)

    if (!prismaStatus) {
      return NextResponse.json({ success: false, message: `Unknown status: ${evmakStatus}` }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: { order: { select: { id: true, orderNumber: true, status: true } } },
    })

    if (!payment) {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 })
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

    await logAuditEvent({
      userId: null,
      action: PAYMENT_AUDIT_ACTIONS.CALLBACK_RECEIVED,
      entity: "callback",
      entityId: null,
      description: `EvPay callback for ${reference} — status: ${evmakStatus}`,
      metadata: { reference, status: evmakStatus, payment_id: payload.payment_id },
    })

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: prismaStatus,
        gatewayStatus: evmakStatus,
        gatewayResponse: payload as never,
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
          reference,
          providerPayload: payload as never,
          metadata: JSON.stringify({
            rawPayload: rawBody,
            evmakStatus,
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
            note: "Payment confirmed via EvPay callback",
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
            note: "Refund confirmed via EvPay callback",
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
            : PAYMENT_AUDIT_ACTIONS.CALLBACK_PROCESSED

    await logAuditEvent({
      userId: null,
      action: auditAction,
      entity: "payment",
      entityId: payment.id,
      description: `Payment ${prismaStatus.toLowerCase()} via EvPay callback for order ${payment.order.orderNumber}`,
      metadata: {
        orderId: payment.order.id,
        reference,
        status: prismaStatus,
      },
    })

    return NextResponse.json({ success: true, message: "Callback processed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[CALLBACK_ERROR]", message)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}