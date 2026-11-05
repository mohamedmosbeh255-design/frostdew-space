import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Reads the visitor's country from the hosting edge. Local development has no
 * geo header, so the client keeps its default storefront.
 */
export async function GET() {
  const requestHeaders = await headers()
  const country = (
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("cf-ipcountry") ??
    ""
  ).toUpperCase()

  return NextResponse.json(
    { country: country || null },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
