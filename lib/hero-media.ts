/**
 * Three saved hero-media slots. One slot is live at a time; the others stay in
 * data/settings.json so seasonal switching does not require re-uploading.
 */

import { isValidMediaSource } from "@/lib/media-source.mjs"

export const HERO_SEASONS = ["winter", "springSummer", "autumn"] as const

export type HeroSeason = (typeof HERO_SEASONS)[number]
export type HeroMediaType = "image" | "video"

export type HeroMedia = {
  type: HeroMediaType
  /** `https://…` or a root-relative public path such as `/uploads/hero/….jpg`. */
  url: string
  /** Optional poster shown before/instead of a video. */
  posterUrl: string
}

export type HeroSeasons = Record<HeroSeason, HeroMedia>

export type HeroMediaField = "type" | "url" | "posterUrl"
export type HeroMediaErrorKey = `hero.seasons.${HeroSeason}.${HeroMediaField}`
export type HeroMediaErrors = Partial<
  Record<HeroMediaErrorKey | "hero.seasons", string>
>

export const DEFAULT_ACTIVE_HERO_SEASON: HeroSeason = "winter"

export const HERO_SEASON_LABELS: Record<HeroSeason, string> = {
  winter: "Winter",
  springSummer: "Spring/Summer",
  autumn: "Autumn",
}

export const HERO_SEASON_HINTS: Record<HeroSeason, string> = {
  winter: "The original frosty video and poster.",
  springSummer: "Bright, warm-weather hero image or video.",
  autumn: "Amber, cozy-season hero image or video.",
}

export const DEFAULT_HERO_SEASONS: HeroSeasons = {
  winter: {
    type: "video",
    url: "/hero/hero-video.mp4",
    posterUrl: "/hero/hero-poster.jpg",
  },
  springSummer: {
    type: "image",
    url: "",
    posterUrl: "",
  },
  autumn: {
    type: "image",
    url: "",
    posterUrl: "",
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function isHeroSeason(value: unknown): value is HeroSeason {
  return typeof value === "string" && (HERO_SEASONS as readonly string[]).includes(value)
}

export function isHeroMediaType(value: unknown): value is HeroMediaType {
  return value === "image" || value === "video"
}

export function cloneHeroMedia(media: HeroMedia): HeroMedia {
  return { type: media.type, url: media.url, posterUrl: media.posterUrl }
}

export function cloneHeroSeasons(seasons: HeroSeasons): HeroSeasons {
  return {
    winter: cloneHeroMedia(seasons.winter),
    springSummer: cloneHeroMedia(seasons.springSummer),
    autumn: cloneHeroMedia(seasons.autumn),
  }
}

export function defaultHeroSettings(): {
  activeSeason: HeroSeason
  seasons: HeroSeasons
} {
  return {
    activeSeason: DEFAULT_ACTIVE_HERO_SEASON,
    seasons: cloneHeroSeasons(DEFAULT_HERO_SEASONS),
  }
}

/** Fail-soft normalization used when reading settings for public pages. */
export function normalizeHeroMedia(value: unknown, fallback: HeroMedia): HeroMedia {
  if (!isRecord(value)) return cloneHeroMedia(fallback)

  const type = isHeroMediaType(value.type) ? value.type : fallback.type

  const rawUrl = value.url
  let url = fallback.url
  if (typeof rawUrl === "string") {
    const candidate = rawUrl.trim()
    url = !candidate || isValidMediaSource(candidate) ? candidate : fallback.url
  }

  const rawPoster = value.posterUrl
  let posterUrl = fallback.posterUrl
  if (typeof rawPoster === "string") {
    const candidate = rawPoster.trim()
    posterUrl = !candidate || isValidMediaSource(candidate) ? candidate : fallback.posterUrl
  }

  return { type, url, posterUrl }
}

export function normalizeHeroSeasons(value: unknown): HeroSeasons {
  if (!isRecord(value)) return cloneHeroSeasons(DEFAULT_HERO_SEASONS)

  return {
    winter: normalizeHeroMedia(value.winter, DEFAULT_HERO_SEASONS.winter),
    springSummer: normalizeHeroMedia(
      value.springSummer,
      DEFAULT_HERO_SEASONS.springSummer,
    ),
    autumn: normalizeHeroMedia(value.autumn, DEFAULT_HERO_SEASONS.autumn),
  }
}

/**
 * Public-site resolver. Falls back to Winter (and then the built-in default)
 * if the selected season has no usable media.
 */
export function resolveActiveHeroMedia(hero: {
  activeSeason?: unknown
  seasons?: unknown
}): HeroMedia {
  const activeSeason = isHeroSeason(hero.activeSeason)
    ? hero.activeSeason
    : DEFAULT_ACTIVE_HERO_SEASON
  const seasons = normalizeHeroSeasons(hero.seasons)

  if (seasons[activeSeason].url) return seasons[activeSeason]
  if (seasons.winter.url) return seasons.winter
  return cloneHeroMedia(DEFAULT_HERO_SEASONS.winter)
}

/**
 * Strict validation for admin writes. Empty inactive slots are allowed; the
 * active slot must have media so the homepage can never lose its background.
 */
export function validateHeroSeasons(
  value: unknown,
  activeSeason: HeroSeason,
): { seasons: HeroSeasons; errors: HeroMediaErrors } {
  if (value !== undefined && !isRecord(value)) {
    return {
      seasons: cloneHeroSeasons(DEFAULT_HERO_SEASONS),
      errors: { "hero.seasons": "Season media must be an object." },
    }
  }

  const seasons = cloneHeroSeasons(DEFAULT_HERO_SEASONS)
  const errors: HeroMediaErrors = {}
  const source = isRecord(value) ? value : {}

  for (const season of HERO_SEASONS) {
    const fallback = DEFAULT_HERO_SEASONS[season]
    const label = HERO_SEASON_LABELS[season]
    const raw = source[season]

    if (raw === undefined) {
      seasons[season] = cloneHeroMedia(fallback)
      if (season === activeSeason && !fallback.url) {
        errors[`hero.seasons.${season}.url`] =
          `Upload or paste media for ${label} before making it live.`
      }
      continue
    }

    if (!isRecord(raw)) {
      seasons[season] = cloneHeroMedia(fallback)
      errors[`hero.seasons.${season}.url`] = `Media for ${label} must be an object.`
      continue
    }

    const type = isHeroMediaType(raw.type) ? raw.type : fallback.type
    if (raw.type !== undefined && !isHeroMediaType(raw.type)) {
      errors[`hero.seasons.${season}.type`] = "Choose image or video."
    }

    let url = fallback.url
    if (raw.url !== undefined) {
      if (typeof raw.url !== "string") {
        errors[`hero.seasons.${season}.url`] = "Media URL must be a string."
      } else {
        url = raw.url.trim()
        if (url && !isValidMediaSource(url)) {
          errors[`hero.seasons.${season}.url`] =
            "Use an https:// URL or a local path starting with /."
        }
      }
    }

    if (season === activeSeason && !url) {
      errors[`hero.seasons.${season}.url`] =
        `Upload or paste media for ${label} before making it live.`
    }

    let posterUrl = fallback.posterUrl
    if (raw.posterUrl !== undefined) {
      if (typeof raw.posterUrl !== "string") {
        errors[`hero.seasons.${season}.posterUrl`] = "Poster URL must be a string."
      } else {
        posterUrl = raw.posterUrl.trim()
        if (posterUrl && !isValidMediaSource(posterUrl)) {
          errors[`hero.seasons.${season}.posterUrl`] =
            "Use an https:// URL or a local path starting with /."
        }
      }
    }

    seasons[season] = { type, url, posterUrl }
  }

  return { seasons, errors }
}

/** Public read helper: preserves a valid active season, otherwise falls back. */
export function normalizeHeroSettings(value: unknown): {
  activeSeason: HeroSeason
  seasons: HeroSeasons
} {
  const hero = isRecord(value) ? value : {}
  const activeSeason = isHeroSeason(hero.activeSeason)
    ? hero.activeSeason
    : DEFAULT_ACTIVE_HERO_SEASON
  const seasons = normalizeHeroSeasons(hero.seasons)
  const safeActive = seasons[activeSeason].url
    ? activeSeason
    : DEFAULT_ACTIVE_HERO_SEASON

  return { activeSeason: safeActive, seasons }
}
