"use client"

import { ChevronDown, Globe2 } from "lucide-react"
import { LOCALES, LOCALE_SHORT_LABELS, isLocale } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences"

export default function LanguageSelector({ solid }: { solid: boolean }) {
  const { locale, setLocale, t } = usePreferences()

  return (
    <div className={`relative inline-flex items-center ${solid ? "text-winter" : "text-white"}`}>
      <Globe2
        className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 opacity-80"
        aria-hidden="true"
      />
      <select
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value)
        }}
        aria-label={t("language.label")}
        className={`h-9 appearance-none rounded-full border py-0 pl-8 pr-7 text-[0.65rem] font-bold uppercase tracking-[0.12em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 ${
          solid
            ? "border-border bg-white/80 text-winter hover:bg-ice focus-visible:ring-primary-500"
            : "border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/70"
        }`}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} aria-label={t(`languageNames.${code}`)}>
            {LOCALE_SHORT_LABELS[code]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3 w-3 opacity-60"
        aria-hidden="true"
      />
    </div>
  )
}
