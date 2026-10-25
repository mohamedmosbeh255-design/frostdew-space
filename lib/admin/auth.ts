import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "frostdew_admin"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

const sessionSecret = () =>
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ""

const digest = (value: string) => createHmac("sha256", sessionSecret()).update(value).digest()

const safeEqual = (a: string, b: string): boolean => {
  const left = digest(a)
  const right = digest(b)
  return timingSafeEqual(left, right)
}

/**
 * Dev: admin is available (provided a password is configured).
 * Production: requires ADMIN_ENABLED=true, which keeps the prototype off public deployments.
 */
export function adminFeatureEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true
  return process.env.ADMIN_ENABLED === "true"
}

export function isAdminConfigured(): boolean {
  return typeof process.env.ADMIN_PASSWORD === "string" && process.env.ADMIN_PASSWORD.length > 0
}

/**
 * Dev: writes are allowed.
 * Production: requires ADMIN_ALLOW_WRITES=true. Vercel's filesystem is read-only, so
 * production should connect this to a database instead (see docs/admin.md).
 */
export function adminWritesEnabled(): boolean {
  if (!adminFeatureEnabled() || !isAdminConfigured()) return false
  if (process.env.NODE_ENV !== "production") return true
  return process.env.ADMIN_ALLOW_WRITES === "true"
}

export function adminPasswordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(candidate, expected)
}

export function createSessionToken(now = Date.now()): string {
  const expiry = String(now + SESSION_MAX_AGE_SECONDS * 1000)
  const signature = createHmac("sha256", sessionSecret()).update(`admin:${expiry}`).digest("hex")
  return `${expiry}.${signature}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const [expiry, signature] = token.split(".")
  if (!expiry || !signature || !/^\d+$/.test(expiry)) return false
  if (Number(expiry) <= Date.now()) return false
  const expected = createHmac("sha256", sessionSecret())
    .update(`admin:${expiry}`)
    .digest("hex")
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!adminFeatureEnabled() || !isAdminConfigured()) return false
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
}

/** Defence in depth against cross-site form posts; the cookie is already SameSite=Lax. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.get("host")
  } catch {
    return false
  }
}
