import { NextResponse } from "next/server"
import { verifyPayment } from "@/features/payments/actions/verify-payment"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`verify:${ip}`, 10, 60_000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { paymentId } = body

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json({ success: false, message: "paymentId is required" }, { status: 400 })
    }

    const result = await verifyPayment(paymentId)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
