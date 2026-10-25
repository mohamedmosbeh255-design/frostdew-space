import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  adminFeatureEnabled,
  adminPasswordMatches,
  createSessionToken,
  isAdminConfigured,
} from "@/lib/admin/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WINDOW_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

const clientKey = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"

export async function POST(request: Request) {
  if (!adminFeatureEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in .env.local and restart the dev server." },
      { status: 503 },
    )
  }

  const key = clientKey(request)
  const now = Date.now()
  const current = attempts.get(key)
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    )
  }

  let password = ""
  try {
    const body: unknown = await request.json()
    if (body && typeof body === "object" && "password" in body) {
      const value = (body as { password?: unknown }).password
      if (typeof value === "string") password = value
    }
  } catch {
    // fall through to the generic failure below
  }

  if (!adminPasswordMatches(password)) {
    const next = current && current.resetAt > now ? current : { count: 0, resetAt: now + WINDOW_MS }
    next.count += 1
    attempts.set(key, next)
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  attempts.delete(key)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), ADMIN_COOKIE_OPTIONS)
  return response
}
