import { NextResponse } from "next/server"
import { guardRead, guardWrite } from "@/lib/admin/api-guard"
import { validatePartners } from "@/lib/partners"
import { validateSiteContent } from "@/lib/site-content"
import { validateSocialLinks } from "@/lib/social-links"
import { readSiteSettings, writeSiteSettings, type SiteSettings } from "@/lib/site-settings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_KEYS = new Set(["socialLinks", "content", "partners"])

export async function GET() {
  const denied = await guardRead()
  if (denied) return denied

  // readSiteSettings is fail-soft, so malformed sections become safe defaults
  // instead of breaking the admin page.
  return NextResponse.json({ settings: await readSiteSettings() })
}

export async function PUT(request: Request) {
  const denied = await guardWrite(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 })
  }

  const record = body as Record<string, unknown>
  const unknownKeys = Object.keys(record).filter((key) => !ALLOWED_KEYS.has(key))
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      { error: `Unknown setting: ${unknownKeys.join(", ")}.` },
      { status: 400 },
    )
  }

  const hasSocialLinks = "socialLinks" in record
  const hasContent = "content" in record
  const hasPartners = "partners" in record
  if (!hasSocialLinks && !hasContent && !hasPartners) {
    return NextResponse.json(
      { error: "Provide socialLinks, content, or partners to update." },
      { status: 400 },
    )
  }

  // Merge into the current file so saving one section never erases the other.
  const current = await readSiteSettings()
  const next: SiteSettings = { ...current }
  const errors: Record<string, string> = {}

  if (hasSocialLinks) {
    const result = validateSocialLinks(record.socialLinks)
    Object.assign(errors, result.errors)
    next.socialLinks = result.links
  }

  if (hasContent) {
    const result = validateSiteContent(record.content)
    Object.assign(errors, result.errors)
    next.content = result.content
  }

  if (hasPartners) {
    const result = validatePartners(record.partners)
    Object.assign(errors, result.errors)
    next.partners = result.partners
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 })
  }

  try {
    await writeSiteSettings(next)
    return NextResponse.json({ ok: true, settings: next })
  } catch {
    return NextResponse.json({ error: "Unable to save site settings." }, { status: 500 })
  }
}
