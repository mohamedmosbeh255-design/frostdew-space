/**
 * Editable site copy stored in data/settings.json under `content`.
 * This module is shared by the admin form, the API, and server components,
 * so the same defaults and validation rules apply everywhere.
 */

import {
  DEFAULT_ACTIVE_HERO_SEASON,
  HERO_SEASON_LABELS,
  defaultHeroSettings,
  isHeroSeason,
  normalizeHeroSettings,
  validateHeroSeasons,
  type HeroMediaErrors,
  type HeroSeason,
  type HeroSeasons,
} from "@/lib/hero-media"

export type SiteContent = {
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    ctaLabel: string
    ctaHref: string
    /** Which saved season slot is currently live. */
    activeSeason: HeroSeason
    /** Three persistent media slots: Winter, Spring/Summer, and Autumn. */
    seasons: HeroSeasons
  }
  about: {
    eyebrow: string
    title: string
    intro: string
  }
  footer: {
    tagline: string
  }
  contact: {
    intro: string
    responseTime: string
  }
}

/** Current public copy. Used to seed new files and fill missing fields. */
export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "K-Beauty Skincare",
    headline: "FROSTDEW",
    subheadline: "Skincare for a Winter-Proof Glow",
    ctaLabel: "Shop the collection",
    ctaHref: "#shop",
    ...defaultHeroSettings(),
  },
  about: {
    eyebrow: "Our Story",
    title: "About FrostDew",
    intro:
      "FrostDew is an independent edit of Korean skincare for cold air, indoor heating, and the long stretch of winter when skin asks for more.",
  },
  footer: {
    tagline: "Skincare for a Winter-Proof Glow",
  },
  contact: {
    intro:
      "Questions about a product, a broken link, or something that needs correcting? Send a note and we will take a look.",
    responseTime:
      "We usually reply within 2 business days. Messages about a specific product are easiest to answer when you include the product name and the page you were on.",
  },
}

export type ContentFieldPath =
  | "hero.eyebrow"
  | "hero.headline"
  | "hero.subheadline"
  | "hero.ctaLabel"
  | "hero.ctaHref"
  | "about.eyebrow"
  | "about.title"
  | "about.intro"
  | "footer.tagline"
  | "contact.intro"
  | "contact.responseTime"

export type ContentErrors = Partial<
  Record<ContentFieldPath | "hero.activeSeason", string>
> &
  HeroMediaErrors & {
    form?: string
  }

type FieldRule = {
  label: string
  max: number
  link?: boolean
}

const RULES: Record<ContentFieldPath, FieldRule> = {
  "hero.eyebrow": { label: "Hero eyebrow", max: 40 },
  "hero.headline": { label: "Main headline", max: 80 },
  "hero.subheadline": { label: "Subheadline", max: 160 },
  "hero.ctaLabel": { label: "CTA button text", max: 40 },
  "hero.ctaHref": { label: "CTA link", max: 300, link: true },
  "about.eyebrow": { label: "About eyebrow", max: 40 },
  "about.title": { label: "About title", max: 120 },
  "about.intro": { label: "About description", max: 600 },
  "footer.tagline": { label: "Footer tagline", max: 160 },
  "contact.intro": { label: "Contact intro", max: 600 },
  "contact.responseTime": { label: "Response time note", max: 600 },
}

const FIELD_PATHS = Object.keys(RULES) as ContentFieldPath[]

const DEFAULTS: Record<ContentFieldPath, string> = {
  "hero.eyebrow": DEFAULT_SITE_CONTENT.hero.eyebrow,
  "hero.headline": DEFAULT_SITE_CONTENT.hero.headline,
  "hero.subheadline": DEFAULT_SITE_CONTENT.hero.subheadline,
  "hero.ctaLabel": DEFAULT_SITE_CONTENT.hero.ctaLabel,
  "hero.ctaHref": DEFAULT_SITE_CONTENT.hero.ctaHref,
  "about.eyebrow": DEFAULT_SITE_CONTENT.about.eyebrow,
  "about.title": DEFAULT_SITE_CONTENT.about.title,
  "about.intro": DEFAULT_SITE_CONTENT.about.intro,
  "footer.tagline": DEFAULT_SITE_CONTENT.footer.tagline,
  "contact.intro": DEFAULT_SITE_CONTENT.contact.intro,
  "contact.responseTime": DEFAULT_SITE_CONTENT.contact.responseTime,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const readPath = (source: Record<string, unknown>, path: ContentFieldPath): unknown => {
  const [section, field] = path.split(".") as [string, string]
  const sectionValue = source[section]
  if (!isRecord(sectionValue)) return undefined
  return sectionValue[field]
}

/**
 * The hero CTA may point at an on-page anchor, an internal path, or an HTTPS URL.
 * Protocol-relative and script URLs are deliberately rejected.
 */
const isAllowedLink = (value: string): boolean => {
  if (value.startsWith("#")) return /^#[A-Za-z0-9_-]+$/.test(value)
  if (value.startsWith("/")) return !value.startsWith("//")
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}

const checkField = (
  path: ContentFieldPath,
  raw: unknown,
): { value: string; error?: string } => {
  const rule = RULES[path]

  if (typeof raw !== "string") {
    return { value: DEFAULTS[path], error: `${rule.label} is required.` }
  }

  const value = raw.trim()
  if (!value) return { value, error: `${rule.label} is required.` }
  if (value.length > rule.max) {
    return {
      value,
      error: `${rule.label} must be ${rule.max} characters or fewer.`,
    }
  }
  if (rule.link && !isAllowedLink(value)) {
    return { value, error: "Use #anchor, /path, or an https:// URL." }
  }

  return { value }
}

const assemble = (
  values: Record<ContentFieldPath, string>,
  hero: { activeSeason: HeroSeason; seasons: HeroSeasons },
): SiteContent => ({
  hero: {
    eyebrow: values["hero.eyebrow"],
    headline: values["hero.headline"],
    subheadline: values["hero.subheadline"],
    ctaLabel: values["hero.ctaLabel"],
    ctaHref: values["hero.ctaHref"],
    activeSeason: hero.activeSeason,
    seasons: hero.seasons,
  },
  about: {
    eyebrow: values["about.eyebrow"],
    title: values["about.title"],
    intro: values["about.intro"],
  },
  footer: {
    tagline: values["footer.tagline"],
  },
  contact: {
    intro: values["contact.intro"],
    responseTime: values["contact.responseTime"],
  },
})

/** A fresh copy of the current defaults, safe to mutate. */
export function emptySiteContent(): SiteContent {
  return assemble({ ...DEFAULTS }, defaultHeroSettings())
}

/**
 * Strict validation for admin writes. Returns the trimmed values plus one
 * error per invalid field. Callers must not write when errors are present.
 */
export function validateSiteContent(value: unknown): {
  content: SiteContent
  errors: ContentErrors
} {
  if (!isRecord(value)) {
    return { content: emptySiteContent(), errors: { form: "Content must be an object." } }
  }

  const values = { ...DEFAULTS }
  const errors: ContentErrors = {}

  for (const path of FIELD_PATHS) {
    const { value: parsed, error } = checkField(path, readPath(value, path))
    values[path] = parsed
    if (error) errors[path] = error
  }

  const heroRecord = isRecord(value.hero) ? value.hero : undefined
  let activeSeason: HeroSeason = DEFAULT_ACTIVE_HERO_SEASON
  if (heroRecord && heroRecord.activeSeason !== undefined) {
    if (isHeroSeason(heroRecord.activeSeason)) {
      activeSeason = heroRecord.activeSeason
    } else {
      errors["hero.activeSeason"] = "Choose Winter, Spring/Summer, or Autumn."
    }
  }

  const { seasons, errors: mediaErrors } = validateHeroSeasons(
    heroRecord?.seasons,
    activeSeason,
  )
  Object.assign(errors, mediaErrors)

  if (!seasons[activeSeason].url) {
    errors["hero.activeSeason"] =
      `Upload media for ${HERO_SEASON_LABELS[activeSeason]} or choose a different live season.`
  }

  return { content: assemble(values, { activeSeason, seasons }), errors }
}

/**
 * Fail-soft read for public pages: missing or invalid fields fall back to the
 * defaults, so a manually edited settings file can never blank out the site.
 */
export function normalizeSiteContent(value: unknown): SiteContent {
  if (!isRecord(value)) return emptySiteContent()

  const values = { ...DEFAULTS }
  for (const path of FIELD_PATHS) {
    const { value: parsed, error } = checkField(path, readPath(value, path))
    values[path] = error ? DEFAULTS[path] : parsed
  }

  return assemble(values, normalizeHeroSettings(value.hero))
}
