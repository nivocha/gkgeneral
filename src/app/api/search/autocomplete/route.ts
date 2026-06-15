import { NextRequest, NextResponse } from "next/server"
import { searchAutocomplete } from "@/features/search/actions"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")
  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }
  const result = await searchAutocomplete(q)
  return NextResponse.json(result)
}
