import { NextResponse } from "next/server"
import { initiatePayment } from "@/features/payments/actions/create-payment"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`init:${ip}`, 5, 60_000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 })
    }

    const result = await initiatePayment(orderId)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
