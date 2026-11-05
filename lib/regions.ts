import type { Locale } from "@/lib/i18n"

export type Country = "US" | "GB" | "CA" | "FR" | "DE" | "KR" | "EU"

export type Currency = "USD" | "GBP" | "CAD" | "EUR" | "KRW"

export type AmazonStore = "amazonUs" | "amazonUk"

export type RegionPreference = {
  country: Country
  locale: Locale
  currency: Currency
  amazonStore: AmazonStore
}

export const COUNTRY_OPTIONS: readonly Country[] = [
  "US",
  "GB",
  "CA",
  "FR",
  "DE",
  "KR",
  "EU",
] as const

export const REGIONS: Record<Country, RegionPreference> = {
  US: { country: "US", locale: "en-US", currency: "USD", amazonStore: "amazonUs" },
  GB: { country: "GB", locale: "en-GB", currency: "GBP", amazonStore: "amazonUk" },
  CA: { country: "CA", locale: "en-US", currency: "CAD", amazonStore: "amazonUs" },
  FR: { country: "FR", locale: "fr-FR", currency: "EUR", amazonStore: "amazonUk" },
  DE: { country: "DE", locale: "de-DE", currency: "EUR", amazonStore: "amazonUk" },
  KR: { country: "KR", locale: "ko-KR", currency: "KRW", amazonStore: "amazonUs" },
  EU: { country: "EU", locale: "en-GB", currency: "EUR", amazonStore: "amazonUk" },
}

export const DEFAULT_REGION: RegionPreference = REGIONS.US

const FRENCH_EU = new Set(["FR", "BE", "LU", "MC"])
const GERMAN_EU = new Set(["DE", "AT"])
const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "MC",
])

export function isCountry(value: unknown): value is Country {
  return typeof value === "string" && (COUNTRY_OPTIONS as readonly string[]).includes(value)
}

export function isCurrency(value: unknown): value is Currency {
  return (
    value === "USD" ||
    value === "GBP" ||
    value === "CAD" ||
    value === "EUR" ||
    value === "KRW"
  )
}

export function isAmazonStore(value: unknown): value is AmazonStore {
  return value === "amazonUs" || value === "amazonUk"
}

export function isRegionPreference(value: unknown): value is RegionPreference {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return (
    isCountry(candidate.country) &&
    (candidate.locale === "en-US" ||
      candidate.locale === "en-GB" ||
      candidate.locale === "fr-FR" ||
      candidate.locale === "de-DE" ||
      candidate.locale === "ko-KR") &&
    isCurrency(candidate.currency) &&
    isAmazonStore(candidate.amazonStore)
  )
}

/** Map an IP country (Vercel header) to the closest supported storefront. */
export function regionFromCountry(value: string | null | undefined): RegionPreference {
  const code = (value ?? "").trim().toUpperCase()
  if (isCountry(code)) return REGIONS[code]

  if (FRENCH_EU.has(code)) return REGIONS.FR
  if (GERMAN_EU.has(code)) return REGIONS.DE
  if (EU_COUNTRIES.has(code)) return REGIONS.EU

  // Canada gets North-American pricing while keeping the English UI.
  if (code === "CA") return REGIONS.CA

  return DEFAULT_REGION
}

export function regionFromLocale(locale: Locale): RegionPreference {
  switch (locale) {
    case "en-GB":
      return REGIONS.GB
    case "fr-FR":
      return REGIONS.FR
    case "de-DE":
      return REGIONS.DE
    case "ko-KR":
      return REGIONS.KR
    default:
      return REGIONS.US
  }
}
