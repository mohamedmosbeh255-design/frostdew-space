"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { translate, type Locale, type TranslationValues } from "@/lib/i18n"
import {
  DEFAULT_REGION,
  isRegionPreference,
  regionFromCountry,
  regionFromLocale,
  type Country,
  type RegionPreference,
} from "@/lib/regions"

const STORAGE_KEY = "frostdew:region:v1"

type PreferencesContextValue = RegionPreference & {
  /** Translate a dotted dictionary key into the active locale. */
  t: (key: string, values?: TranslationValues) => string
  setLocale: (locale: Locale) => void
  setCountry: (country: Country) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function readStoredRegion(): RegionPreference | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isRegionPreference(parsed) ? parsed : null
  } catch {
    return null
  }
}

function storeRegion(region: RegionPreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(region))
  } catch {
    // Private mode can reject storage; the in-memory preference still works.
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Always start with the default so server and first client render agree.
  const [region, setRegion] = useState<RegionPreference>(DEFAULT_REGION)
  const manualRef = useRef(false)

  const applyRegion = useCallback((next: RegionPreference, manual: boolean) => {
    if (manual) manualRef.current = true
    setRegion(next)
    if (manual) storeRegion(next)
  }, [])

  const setLocale = useCallback(
    (locale: Locale) => applyRegion(regionFromLocale(locale), true),
    [applyRegion],
  )

  const setCountry = useCallback(
    (country: Country) => applyRegion(regionFromCountry(country), true),
    [applyRegion],
  )

  useEffect(() => {
    const stored = readStoredRegion()
    if (stored) {
      manualRef.current = true
      setRegion(stored)
      return
    }

    let cancelled = false
    let idleId: number | undefined
    let timeoutId: number | undefined

    const loadGeo = () => {
      fetch("/api/geo", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          if (cancelled || manualRef.current || !data || typeof data !== "object") return
          const country = (data as { country?: unknown }).country
          if (typeof country !== "string") return
          setRegion(regionFromCountry(country))
        })
        .catch(() => {
          // A blocked geo request simply keeps the default storefront.
        })
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(loadGeo, { timeout: 2500 })
    } else {
      timeoutId = window.setTimeout(loadGeo, 1200)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = region.locale
  }, [region.locale])

  const t = useCallback(
    (key: string, values?: TranslationValues) => translate(region.locale, key, values),
    [region.locale],
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...region, t, setLocale, setCountry }),
    [region, t, setLocale, setCountry],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext)
  if (!value) {
    throw new Error("usePreferences must be used inside PreferencesProvider")
  }
  return value
}
