import enUS from "@/i18n/en-US.json"
import enGB from "@/i18n/en-GB.json"
import frFR from "@/i18n/fr-FR.json"
import deDE from "@/i18n/de-DE.json"
import koKR from "@/i18n/ko-KR.json"

export const LOCALES = ["en-US", "en-GB", "fr-FR", "de-DE", "ko-KR"] as const

export type Locale = (typeof LOCALES)[number]

export type Dictionary = typeof enUS

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

const PARTIAL_DICTIONARIES: Record<Exclude<Locale, "en-US">, DeepPartial<Dictionary>> = {
  "en-GB": enGB,
  "fr-FR": frFR,
  "de-DE": deDE,
  "ko-KR": koKR,
}

/** Short labels keep the header selector compact on narrow screens. */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  "en-US": "EN · US",
  "en-GB": "EN · UK",
  "fr-FR": "FR",
  "de-DE": "DE",
  "ko-KR": "KO",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function mergeDictionary<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!isRecord(base) || !isRecord(override)) {
    return (override === undefined ? base : (override as T)) ?? base
  }

  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    const current = result[key]
    result[key] =
      isRecord(current) && isRecord(value) ? mergeDictionary(current, value as never) : value
  }
  return result as T
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  "en-US": enUS,
  "en-GB": mergeDictionary(enUS, enGB),
  "fr-FR": mergeDictionary(enUS, frFR),
  "de-DE": mergeDictionary(enUS, deDE),
  "ko-KR": mergeDictionary(enUS, koKR),
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES["en-US"]
}

function lookup(dictionary: Dictionary, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined
    return current[key]
  }, dictionary)
}

export type TranslationValues = Record<string, string | number>

/** Resolve a dotted key and interpolate `{name}` placeholders. */
export function translate(
  locale: Locale,
  key: string,
  values?: TranslationValues,
): string {
  const resolved = lookup(getDictionary(locale), key)
  const template = typeof resolved === "string" ? resolved : key
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}
