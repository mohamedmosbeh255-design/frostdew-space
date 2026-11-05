"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Globe2,
  Headphones,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react"
import OptimizedImage from "@/components/ui/OptimizedImage"
import { usePreferences } from "@/lib/preferences"
import { COUNTRY_OPTIONS, isCountry } from "@/lib/regions"
import { buildNarration, estimateReadingDurationMs, findPremiumVoice } from "@/lib/speech"

type AudioProduct = {
  id: string
  brand: string
  name: string
  description: string
  image: string
}

const WAVE_BARS = [0, 1, 2, 3, 4, 5, 6]

export default function AudioAssistant() {
  const { locale, country, setCountry, t } = usePreferences()
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<AudioProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voicesReady, setVoicesReady] = useState(false)

  const requestedRef = useRef(false)
  const lastTickRef = useRef(0)

  const product = products[index]
  const narration = product ? buildNarration(product) : ""
  const duration = estimateReadingDurationMs(narration)
  const voice = useMemo(() => findPremiumVoice(voices, locale), [voices, locale])
  const languageName = t(`languageNames.${locale}`)
  const readingMode = voicesReady && voice === null
  const canPlay = !loading && !error && Boolean(product) && voicesReady

  // ---------------------------------------------------------------------
  // Catalog: fetched once, and only after the visitor opens the player.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!open || requestedRef.current) return
    requestedRef.current = true
    setLoading(true)
    setError(false)

    fetch("/api/audio/catalog")
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
        return response.json() as Promise<{ products?: AudioProduct[] }>
      })
      .then((data) => {
        const list = Array.isArray(data.products)
          ? data.products.filter(
              (item): item is AudioProduct =>
                Boolean(item) &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.brand === "string" &&
                typeof item.description === "string" &&
                typeof item.image === "string",
            )
          : []
        setProducts(list)
      })
      .catch(() => {
        requestedRef.current = false
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [open])

  // Keep the current item valid if the catalog shrinks after a refresh.
  useEffect(() => {
    if (products.length > 0 && index >= products.length) setIndex(0)
  }, [index, products.length])

  // ---------------------------------------------------------------------
  // Voices: Chrome fills the list asynchronously; Safari only exposes some
  // after a user gesture, so both event styles and a delayed retry are used.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoicesReady(true)
      return
    }

    const synth = window.speechSynthesis
    const load = () => {
      const available = synth.getVoices()
      setVoices(available)
      // Resolve even with an empty list: no premium voice means Reading Mode,
      // not a permanently disabled play button.
      setVoicesReady(true)
    }

    load()
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", load)
    }
    // Safari historically only reported voice changes through this property.
    synth.onvoiceschanged = load
    const retry = window.setTimeout(load, 900)

    return () => {
      if (typeof synth.removeEventListener === "function") {
        synth.removeEventListener("voiceschanged", load)
      }
      if (synth.onvoiceschanged === load) synth.onvoiceschanged = null
      window.clearTimeout(retry)
    }
  }, [])

  // ---------------------------------------------------------------------
  // Speech playback. Restarts whenever the track, voice, or locale changes.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!open || !playing || !product || !voicesReady || !voice) return
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(narration)
    utterance.voice = voice
    utterance.lang = locale
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => {
      setProgress(0)
      setIndex((current) => (products.length ? (current + 1) % products.length : 0))
    }
    utterance.onerror = (event) => {
      // Interruptions are expected when skipping or changing language.
      if (event.error === "interrupted" || event.error === "canceled") return
      setPlaying(false)
    }

    synth.speak(utterance)
    return () => synth.cancel()
  }, [open, playing, product, voicesReady, voice, locale, narration, products.length])

  // Progress and Reading Mode timing. Reading Mode advances like a slideshow.
  useEffect(() => {
    if (!open || !playing) {
      lastTickRef.current = 0
      return
    }

    lastTickRef.current = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const elapsed = now - lastTickRef.current
      lastTickRef.current = now
      setProgress((current) => Math.min(100, current + (elapsed / Math.max(1, duration)) * 100))
    }, 120)

    return () => window.clearInterval(timer)
  }, [open, playing, duration, index])

  // Reading Mode has no `onend` event, so advance once the estimate completes.
  useEffect(() => {
    if (!open || !playing || !readingMode || progress < 100) return
    const timer = window.setTimeout(() => {
      setProgress(0)
      setIndex((current) => (products.length ? (current + 1) % products.length : 0))
    }, 900)
    return () => window.clearTimeout(timer)
  }, [open, playing, readingMode, progress, products.length])

  const stop = useCallback(() => {
    setPlaying(false)
    setProgress(0)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const close = useCallback(() => {
    stop()
    setOpen(false)
  }, [stop])

  const togglePlay = useCallback(() => {
    if (!canPlay) return
    if (playing) {
      stop()
    } else {
      setProgress(0)
      setPlaying(true)
    }
  }, [canPlay, playing, stop])

  const skip = useCallback(
    (direction: 1 | -1) => {
      if (!products.length) return
      setProgress(0)
      setIndex((current) => (current + direction + products.length) % products.length)
    },
    [products.length],
  )

  // Space toggles playback while the panel is open, unless the shopper is
  // typing or choosing an option. Escape closes the panel.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInteractive =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "BUTTON" ||
        target?.tagName === "A" ||
        target?.isContentEditable

      if (event.key === "Escape") {
        close()
        return
      }
      if (isInteractive) return
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, togglePlay, close])

  // Browsers can leave the synth speaking after a route change or unmount.
  useEffect(() => () => stop(), [stop])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("audio.open")}
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-white/60 bg-winter/95 py-3 pl-4 pr-5 text-sm font-bold text-white shadow-xl backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-winter motion-reduce:transform-none"
      >
        <Headphones className="h-4 w-4 text-ice" aria-hidden="true" />
        <span>{t("audio.listen")}</span>
        <span className="audio-wave" aria-hidden="true">
          {WAVE_BARS.map((bar) => (
            <span
              key={bar}
              className="audio-wave__bar"
              style={{ animationDelay: `${bar * 0.11}s` }}
            />
          ))}
        </span>
      </button>
    )
  }

  return (
    <section
      role="dialog"
      aria-label={t("audio.title")}
      aria-modal="false"
      className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-3xl border border-white/70 bg-snow/95 text-midnight shadow-2xl backdrop-blur-xl sm:left-auto sm:w-[24rem]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-medium leading-none">
            <Headphones className="h-4 w-4 text-primary-600" aria-hidden="true" />
            {t("audio.title")}
          </p>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
            {t("audio.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("audio.close")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-winter shadow-sm transition-colors hover:bg-ice focus-visible:outline-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 py-4">
        <label className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-glacier">
          <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{t("audio.region")}</span>
          <select
            value={country}
            onChange={(event) => {
              if (isCountry(event.target.value)) {
                stop()
                setCountry(event.target.value)
              }
            }}
            aria-label={t("audio.region")}
            className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-white px-2 text-xs font-semibold tracking-normal text-midnight focus-visible:outline-2"
          >
            {COUNTRY_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {t(`countries.${code}`)}
              </option>
            ))}
          </select>
        </label>

        {loading && (
          <p className="mt-5 flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("audio.loading")}
          </p>
        )}

        {!loading && error && (
          <p className="mt-5 rounded-xl bg-rose-50 px-3 py-3 text-center text-sm leading-snug text-rose-800">
            {t("audio.error")}
          </p>
        )}

        {!loading && !error && !product && (
          <p className="mt-5 rounded-xl bg-white px-3 py-3 text-center text-sm text-muted-foreground">
            {t("audio.empty")}
          </p>
        )}

        {!loading && !error && product && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/products/${product.id}`}
                aria-label={t("audio.thumbnailLabel", { name: product.name })}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-white transition-transform hover:scale-[1.03] focus-visible:outline-2"
              >
                <OptimizedImage
                  src={product.image}
                  alt={`${product.brand} ${product.name}`}
                  fill
                  sizes="64px"
                  className="h-full w-full"
                  imageClassName="h-full w-full object-contain p-1.5"
                  referrerPolicy="no-referrer"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-glacier">
                  {t("audio.nowReading")}
                </p>
                <p className="truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] text-primary-600">
                  {product.brand}
                </p>
                <Link
                  href={`/products/${product.id}`}
                  className="line-clamp-2 font-display text-sm font-medium leading-snug text-midnight underline-offset-2 hover:underline"
                >
                  {product.name}
                </Link>
              </div>

              <span className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                {t("audio.counter", { current: index + 1, total: products.length })}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              {readingMode ? (
                <span
                  className={`reading-mode ${playing ? "reading-mode--active" : ""}`}
                  aria-hidden="true"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span
                  className={`audio-wave audio-wave--large ${playing ? "" : "audio-wave--paused"}`}
                  role="img"
                  aria-label={playing ? t("audio.waveLabel") : undefined}
                  aria-hidden={playing ? undefined : true}
                >
                  {WAVE_BARS.map((bar) => (
                    <span
                      key={bar}
                      className="audio-wave__bar"
                      style={{ animationDelay: `${bar * 0.1}s` }}
                    />
                  ))}
                </span>
              )}

              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ice">
                <div
                  className="h-full rounded-full bg-primary-600 transition-[width] duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="w-9 shrink-0 text-right text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => skip(-1)}
                aria-label={t("audio.previous")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-winter transition-colors hover:bg-ice focus-visible:outline-2"
              >
                <SkipBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={!canPlay}
                aria-label={playing ? t("audio.pause") : t("audio.play")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-soft transition-colors hover:bg-primary-600 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {playing ? (
                  <Pause className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => skip(1)}
                aria-label={t("audio.next")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-winter transition-colors hover:bg-ice focus-visible:outline-2"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {readingMode ? (
              <div className="mt-4 rounded-xl border border-glacier/20 bg-white/80 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary-700">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  {t("audio.readingMode")}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {t("audio.noVoice", { language: languageName })}
                </p>
              </div>
            ) : (
              <p className="mt-4 truncate text-center text-[0.65rem] text-muted-foreground">
                {voice ? t("audio.voice", { voice: voice.name }) : t("common.loading")}
              </p>
            )}

            <p className="mt-2 text-center text-[0.6rem] leading-snug text-muted-foreground">
              {t("audio.originalLanguage")}
            </p>
            <p className="mt-1 hidden text-center text-[0.6rem] text-glacier sm:block">
              {t("audio.spaceHint")}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
