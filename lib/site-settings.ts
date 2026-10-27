import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { normalizePartners, type PartnerLink } from "@/lib/partners"
import {
  normalizeSiteContent,
  type SiteContent,
} from "@/lib/site-content"
import {
  emptySocialLinks,
  validateSocialLinks,
  type SocialLinks,
} from "@/lib/social-links"

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json")

export type SiteSettings = {
  socialLinks: SocialLinks
  content: SiteContent
  partners: PartnerLink[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const fallbackSettings = (): SiteSettings => ({
  socialLinks: emptySocialLinks(),
  content: normalizeSiteContent(undefined),
  partners: [],
})

/**
 * Reads data/settings.json. Missing or malformed sections fall back to safe
 * values, so a bad settings file can never take the public site down.
 */
export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8")
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return fallbackSettings()

    const { links } = validateSocialLinks(parsed.socialLinks)
    return {
      socialLinks: links,
      content: normalizeSiteContent(parsed.content),
      partners: normalizePartners(parsed.partners),
    }
  } catch {
    return fallbackSettings()
  }
}

/** Writes to a temporary file first, then renames, so settings are never half-written. */
export async function writeSiteSettings(settings: SiteSettings): Promise<void> {
  const payload = `${JSON.stringify(settings, null, 2)}\n`
  const temporary = `${SETTINGS_FILE}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, payload, "utf8")
  await rename(temporary, SETTINGS_FILE)
}
