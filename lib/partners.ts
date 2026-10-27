/**
 * Editable partner store links stored in data/settings.json under `partners`.
 * Shared by the admin form, the API, and the footer.
 */

export type PartnerLink = {
  name: string
  url: string
  newTab: boolean
}

export type PartnerErrors = Record<string, string>

export const MAX_PARTNERS = 20

const MAX_NAME_LENGTH = 80
const MAX_URL_LENGTH = 300

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const parseHttpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

/** Ignores trailing slashes and tracking queries when detecting duplicates. */
const urlKey = (url: URL): string =>
  `${url.host}${url.pathname.replace(/\/+$/, "")}`.toLowerCase()

export function emptyPartners(): PartnerLink[] {
  return []
}

/**
 * Strict validation for admin writes. Returns trimmed values plus one error
 * per invalid field. Callers must not write when errors are present.
 */
export function validatePartners(value: unknown): {
  partners: PartnerLink[]
  errors: PartnerErrors
} {
  if (!Array.isArray(value)) {
    return { partners: [], errors: { form: "Partners must be a list." } }
  }

  if (value.length > MAX_PARTNERS) {
    return {
      partners: [],
      errors: { form: `Add ${MAX_PARTNERS} partners or fewer.` },
    }
  }

  const partners: PartnerLink[] = []
  const errors: PartnerErrors = {}
  const seen = new Map<string, number>()

  value.forEach((item, index) => {
    const prefix = `partners.${index}`

    if (!isRecord(item)) {
      errors[`${prefix}.name`] = "Name is required."
      errors[`${prefix}.url`] = "URL is required."
      partners.push({ name: "", url: "", newTab: false })
      return
    }

    const name = typeof item.name === "string" ? item.name.trim() : ""
    const url = typeof item.url === "string" ? item.url.trim() : ""
    const newTab = item.newTab === true

    if (!name) {
      errors[`${prefix}.name`] = "Name is required."
    } else if (name.length > MAX_NAME_LENGTH) {
      errors[`${prefix}.name`] = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
    }

    if (item.newTab !== undefined && typeof item.newTab !== "boolean") {
      errors[`${prefix}.newTab`] = "Choose whether to open this link in a new tab."
    }

    if (!url) {
      errors[`${prefix}.url`] = "URL is required."
    } else if (url.length > MAX_URL_LENGTH) {
      errors[`${prefix}.url`] = `URL must be ${MAX_URL_LENGTH} characters or fewer.`
    } else {
      const parsed = parseHttpsUrl(url)
      if (!parsed) {
        errors[`${prefix}.url`] = "Enter a valid https:// URL."
      } else {
        const key = urlKey(parsed)
        const duplicateIndex = seen.get(key)
        if (duplicateIndex !== undefined) {
          errors[`${prefix}.url`] = `This URL is already used by partner ${duplicateIndex + 1}.`
        } else {
          seen.set(key, index)
        }
      }
    }

    partners.push({ name, url, newTab })
  })

  return { partners, errors }
}

/**
 * Fail-soft read for the public footer: drops malformed or duplicate entries
 * instead of rendering broken links.
 */
export function normalizePartners(value: unknown): PartnerLink[] {
  if (!Array.isArray(value)) return []

  const partners: PartnerLink[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!isRecord(item)) continue
    if (typeof item.name !== "string" || typeof item.url !== "string") continue

    const name = item.name.trim()
    const url = item.url.trim()
    if (!name || name.length > MAX_NAME_LENGTH || url.length > MAX_URL_LENGTH) continue

    const parsed = parseHttpsUrl(url)
    if (!parsed) continue

    const key = urlKey(parsed)
    if (seen.has(key)) continue
    seen.add(key)

    partners.push({ name, url, newTab: item.newTab === true })
    if (partners.length >= MAX_PARTNERS) break
  }

  return partners
}
