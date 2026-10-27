export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "pinterest",
  "youtube",
  "x",
  "threads",
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export type SocialLinks = Record<SocialPlatform, string>

export const SOCIAL_META: Record<
  SocialPlatform,
  { label: string; placeholder: string; hostHint: string }
> = {
  instagram: {
    label: "Instagram",
    placeholder: "https://www.instagram.com/yourhandle/",
    hostHint: "instagram.com",
  },
  tiktok: {
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@yourhandle",
    hostHint: "tiktok.com",
  },
  pinterest: {
    label: "Pinterest",
    placeholder: "https://www.pinterest.com/yourhandle/",
    hostHint: "pinterest.com or a regional Pinterest domain",
  },
  youtube: {
    label: "YouTube",
    placeholder: "https://www.youtube.com/@yourhandle",
    hostHint: "youtube.com or youtu.be",
  },
  x: {
    label: "X (Twitter)",
    placeholder: "https://x.com/yourhandle",
    hostHint: "x.com or twitter.com",
  },
  threads: {
    label: "Threads",
    placeholder: "https://www.threads.net/@yourhandle",
    hostHint: "threads.net or threads.com",
  },
}

const ALLOWED_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  pinterest: ["pinterest.com"],
  youtube: ["youtube.com", "youtu.be"],
  x: ["x.com", "twitter.com"],
  threads: ["threads.net", "threads.com"],
}

export type SocialLinkErrors = Partial<Record<SocialPlatform, string>> & {
  form?: string
}

export function emptySocialLinks(): SocialLinks {
  return {
    instagram: "",
    tiktok: "",
    pinterest: "",
    youtube: "",
    x: "",
    threads: "",
  }
}

const isPinterestHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^www\./, "")
  return host === "pinterest.com" || /^pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)
}

const isAllowedHost = (platform: SocialPlatform, hostname: string): boolean => {
  if (platform === "pinterest") return isPinterestHost(hostname)
  return ALLOWED_HOSTS[platform].some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  )
}

/** Ignores query strings so the same profile is not accepted twice with tracking params. */
const duplicateKey = (url: URL): string =>
  `${url.hostname}${url.pathname.replace(/\/+$/, "")}`.toLowerCase()

/**
 * Validates an admin-submitted socialLinks object.
 * Empty strings are valid and hide the platform in the footer.
 */
export function validateSocialLinks(value: unknown): {
  links: SocialLinks
  errors: SocialLinkErrors
} {
  const links = emptySocialLinks()
  const errors: SocialLinkErrors = {}

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { links, errors: { form: "Social links must be an object." } }
  }

  const record = value as Record<string, unknown>
  const unexpected = Object.keys(record).filter(
    (key) => !SOCIAL_PLATFORMS.includes(key as SocialPlatform),
  )
  if (unexpected.length > 0) {
    errors.form = `Unknown social platform: ${unexpected.join(", ")}.`
  }

  const seen = new Map<string, SocialPlatform>()

  for (const platform of SOCIAL_PLATFORMS) {
    const raw = record[platform]

    if (raw === undefined || raw === null) {
      links[platform] = ""
      continue
    }

    if (typeof raw !== "string") {
      errors[platform] = "Enter a URL or leave this field blank."
      continue
    }

    const urlValue = raw.trim()
    if (!urlValue) {
      links[platform] = ""
      continue
    }

    if (urlValue.length > 300) {
      errors[platform] = "URL must be 300 characters or fewer."
      continue
    }

    let parsed: URL
    try {
      parsed = new URL(urlValue)
    } catch {
      errors[platform] = "Enter a valid URL."
      continue
    }

    if (parsed.protocol !== "https:") {
      errors[platform] = "Use an https:// URL."
      continue
    }

    if (parsed.username || parsed.password) {
      errors[platform] = "URLs cannot include a username or password."
      continue
    }

    if (!isAllowedHost(platform, parsed.hostname.toLowerCase())) {
      errors[platform] = `Use a ${SOCIAL_META[platform].hostHint} URL.`
      continue
    }

    const key = duplicateKey(parsed)
    const duplicateOf = seen.get(key)
    if (duplicateOf) {
      errors[platform] = `Same URL as ${SOCIAL_META[duplicateOf].label}.`
      continue
    }

    seen.set(key, platform)
    links[platform] = urlValue
  }

  return { links, errors }
}
