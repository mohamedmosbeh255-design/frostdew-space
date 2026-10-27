import { getSupabaseAdminClient, getSupabasePublicClient } from "@/lib/supabase"
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

export type SiteSettings = {
  socialLinks: SocialLinks
  content: SiteContent
  partners: PartnerLink[]
}

export class SiteSettingsStoreError extends Error {}

const fallbackSettings = (): SiteSettings => ({
  socialLinks: emptySocialLinks(),
  content: normalizeSiteContent(undefined),
  partners: [],
})

/**
 * Reads the singleton settings row and the ordered partner list.
 *
 * By default each section falls back safely, so a transient database or
 * settings error cannot take the public site down. Admin write paths pass
 * `{ strict: true }` so a failed read throws instead of silently returning
 * defaults that would then overwrite the real row.
 */
export async function readSiteSettings(
  options: { strict?: boolean } = {},
): Promise<SiteSettings> {
  const strict = options.strict === true

  let supabase
  try {
    supabase = getSupabasePublicClient()
  } catch (error) {
    console.error("[settings] Supabase is not configured:", error)
    if (strict) throw new SiteSettingsStoreError("Supabase is not configured.")
    return fallbackSettings()
  }

  let socialLinks: SocialLinks = emptySocialLinks()
  let content = normalizeSiteContent(undefined)
  let partners: PartnerLink[] = []

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("social_links, content")
      .eq("id", "default")
      .maybeSingle()

    if (error) throw error

    const validated = validateSocialLinks(data?.social_links)
    socialLinks = validated.links
    content = normalizeSiteContent(data?.content)
  } catch (error) {
    console.error("[settings] Unable to read site settings from Supabase:", error)
    if (strict) throw new SiteSettingsStoreError("Unable to read site settings.")
  }

  try {
    const { data, error } = await supabase
      .from("partners")
      .select("name, url, new_tab")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) throw error

    partners = normalizePartners(
      (data ?? []).map((partner) => ({
        name: partner.name,
        url: partner.url,
        newTab: partner.new_tab,
      })),
    )
  } catch (error) {
    console.error("[settings] Unable to read partners from Supabase:", error)
    if (strict) throw new SiteSettingsStoreError("Unable to read partners.")
  }

  return { socialLinks, content, partners }
}

/**
 * Atomically writes the settings row and replaces the partner list through the
 * save_site_settings() database function. Admin only.
 */
export async function writeSiteSettings(settings: SiteSettings): Promise<void> {
  const { error } = await getSupabaseAdminClient().rpc("save_site_settings", {
    p_social_links: settings.socialLinks,
    p_content: settings.content,
    p_partners: settings.partners.map((partner, index) => ({
      name: partner.name,
      url: partner.url,
      new_tab: partner.newTab,
      position: index,
    })),
  })

  if (error) {
    console.error("[settings] Unable to save site settings to Supabase:", error)
    throw new SiteSettingsStoreError("Unable to save site settings.")
  }
}

// Kept for callers that need the exact default shape without touching the DB.
export { fallbackSettings }
