import { NextResponse } from "next/server"
import { adjustInventory } from "@/features/inventory/actions/inventory"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await adjustInventory(body)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
