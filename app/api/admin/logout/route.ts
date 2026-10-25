import { NextResponse } from "next/server"
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/admin/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, "", { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 })
  return response
}
