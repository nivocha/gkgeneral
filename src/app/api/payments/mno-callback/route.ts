import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { assertValidTransition } from "@/features/payments/lib/payment-state-machine"
import { PAYMENT_AUDIT_ACTIONS } from "@/features/payments/lib/audit-actions"
import { commitInventoryForOrder } from "@/features/payments/lib/inventory"
import type { PaymentStatus } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ Status: "Failed" }, { status: 400 })
    }

    const reference = (payload.ThirdPartyReference as string) || (payload.order_id as string) || ""

    if (!reference) {
      return NextResponse.json({ Status: "Failed" }, { status: 400 })
    }

    const transactionStatus = (payload.TransactionStatus as string) || ""

    const isSuccess = transactionStatus.toLowerCase() === "success"
    const isFailed = transactionStatus.toLowerCase() === "failed" || transactionStatus.toLowerCase() === "expired"

    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: { order: { select: { id: true, orderNumber: true, status: true } } },
    })

    if (!payment) {
      return NextResponse.json({ Status: "Failed" }, { status: 404 })
    }

    const currentStatus = payment.status as PaymentStatus

    if (isSuccess) {
      try {
        assertValidTransition(currentStatus, "Paid")
      } catch {
        return NextResponse.json({ Status: "Success" })
      }
    } else if (isFailed) {
      try {
        assertValidTransition(currentStatus, "Failed")
      } catch {
        return NextResponse.json({ Status: "Success" })
      }
    }

    const newStatus = isSuccess ? "Paid" : isFailed ? "Failed" : null
    if (!newStatus) {
      return NextResponse.json({ Status: "Success" })
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          gatewayStatus: transactionStatus,
          paidAt: isSuccess ? new Date() : undefined,
          transactionReference: (payload.TransID as string) || undefined,
          gatewayResponse: payload as never,
        },
      })

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          status: newStatus,
          amount: payment.amount,
          reference,
          externalReference: (payload.TransID as string) || undefined,
          providerPayload: payload as never,
          metadata: JSON.stringify({
            rawPayload: rawBody,
            mnoTransactionId: payload.TransID,
          }),
        },
      })

      if (isSuccess && payment.order.status === "Pending") {
        await tx.order.update({
          where: { id: payment.order.id },
          data: { status: "Processing" },
        })
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: "Processing",
            changedBy: null,
            note: "Payment confirmed via MNO callback",
          },
        })

        await commitInventoryForOrder(tx as any, payment.order.id, payment.order.orderNumber)
      }
    })

    await logAuditEvent({
      userId: null,
      action: isSuccess ? PAYMENT_AUDIT_ACTIONS.PAYMENT_COMPLETED : PAYMENT_AUDIT_ACTIONS.PAYMENT_FAILED,
      entity: "payment",
      entityId: payment.id,
      description: `MNO payment ${newStatus.toLowerCase()} for order ${payment.order.orderNumber}`,
      metadata: {
        orderId: payment.order.id,
        reference,
        status: newStatus,
        mnoTransactionId: payload.TransID,
      },
    })

    return NextResponse.json({ Status: "Success" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[MNO_CALLBACK_ERROR]", message)
    return NextResponse.json({ Status: "Failed" }, { status: 500 })
  }
}