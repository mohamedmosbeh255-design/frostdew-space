"use client"

import { useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Droplets,
  Eraser,
  FlaskConical,
  Leaf,
  ListChecks,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2,
} from "lucide-react"
import { AFFILIATE_PROXIMITY_NOTE } from "@/lib/site"
import type { Product } from "@/lib/products"
import { analyzeRoutine, type RoutineAnalysis } from "@/lib/routine-analysis"
import { suggestProducts } from "@/lib/routine-recommendations"
import DailyQA from "./DailyQA"
import ProductSuggestion from "./ProductSuggestion"
import ResultDisplay from "./ResultDisplay"

type Preset = {
  id: string
  title: string
  note: string
  icon: typeof ShieldCheck
  routine: string
}

const PRESETS: Preset[] = [
  {
    id: "barrier",
    title: "Barrier reset",
    note: "Fragrance-free basics",
    icon: ShieldCheck,
    routine: `Gentle low-pH cleanser
Ceramide hydrating toner
Snail mucin essence
Panthenol barrier cream
SPF 50+ sunscreen`,
  },
  {
    id: "acne",
    title: "Oily & breakout-prone",
    note: "Two exfoliants, one lesson",
    icon: Droplets,
    routine: `Salicylic acid cleanser
AHA/BHA toner
Niacinamide 5% serum
Oil-free moisturizer
SPF 50 sunscreen`,
  },
  {
    id: "brightening",
    title: "Dullness & dark spots",
    note: "Vitamin C plus retinoid",
    icon: Sun,
    routine: `Low-pH cleanser
Vitamin C 15% serum
Niacinamide 5% serum
Retinol 0.3% serum
Moisturizer
SPF 50`,
  },
  {
    id: "retinol",
    title: "First retinol night",
    note: "Acid on the same night",
    icon: FlaskConical,
    routine: `Gentle cleanser
AHA toner
Retinol 0.2% serum
Ceramide moisturizer
SPF 50 (AM)`,
  },
  {
    id: "overload",
    title: "Over-exfoliated",
    note: "The kitchen-sink routine",
    icon: AlertTriangle,
    routine: `Foaming cleanser
AHA toner
BHA serum
Vitamin C serum
Retinol serum
Benzoyl peroxide spot treatment
Moisturizer
SPF 50`,
  },
]

const PLACEHOLDER = `Gentle low-pH cleanser
Hydrating toner with ceramides
Vitamin C 15% serum
Niacinamide 5% serum
Ceramide moisturizer
SPF 50+ sunscreen`

const CHECKED_ITEMS = [
  "Application order: cleanse → treat → moisturize → protect",
  "Ingredient conflicts such as retinoids with acids",
  "pH-sensitive layers and where they sit",
  "Step load and over-exfoliation risk",
]

function EmptyReport() {
  return (
    <div className="flex h-full min-h-[28rem] flex-col justify-center rounded-3xl border border-dashed border-glacier/40 bg-white/55 p-6 text-center shadow-sm sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ice text-winter">
        <ScanSearch className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-medium text-midnight">
        Your routine report appears here
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Paste your routine, or choose a preset, and the decoder will look for order problems,
        ingredient clashes, pH friction and over-exfoliation.
      </p>
      <ul className="mx-auto mt-5 w-full max-w-md space-y-2 text-left">
        {CHECKED_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-winter">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
        One product per line gives the clearest read. The analysis runs in your browser and is
        never stored.
      </p>
    </div>
  )
}

export default function RoutineDecoder({
  products,
  today,
}: {
  products: Product[]
  today: string
}) {
  const [text, setText] = useState("")
  const [analysis, setAnalysis] = useState<RoutineAnalysis | null>(null)
  const [analyzedText, setAnalyzedText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () => (analysis ? suggestProducts(products, analysis) : []),
    [analysis, products],
  )
  const stale = analysis !== null && text.trim() !== analyzedText

  const runAnalysis = (value: string) => {
    if (!value.trim()) {
      setError("Paste at least one product or ingredient list to analyze.")
      setAnalysis(null)
      setAnalyzedText("")
      return
    }

    const next = analyzeRoutine(value)
    setAnalysis(next)
    setAnalyzedText(value.trim())
    setError(null)

    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAnalysis(text)
  }

  const applyPreset = (preset: Preset) => {
    setText(preset.routine)
    runAnalysis(preset.routine)
  }

  const clear = () => {
    setText("")
    setAnalysis(null)
    setAnalyzedText("")
    setError(null)
  }

  return (
    <div className="flex flex-col gap-14">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <section
          aria-labelledby="routine-input-title"
          className="rounded-3xl border border-border bg-white/85 p-5 shadow-soft backdrop-blur-sm sm:p-6 lg:sticky lg:top-24"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-glacier">
                01 · Input
              </p>
              <h2 id="routine-input-title" className="mt-1 font-display text-2xl font-medium text-midnight">
                Paste your routine
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-800">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Runs locally
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <label htmlFor="routine-input" className="sr-only">
              Your skincare routine
            </label>
            <textarea
              id="routine-input"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                if (error) setError(null)
              }}
              rows={9}
              maxLength={4000}
              placeholder={PLACEHOLDER}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "routine-input-error" : "routine-input-hint"}
              className="w-full resize-y rounded-2xl border border-border bg-white px-3.5 py-3 font-sans text-sm leading-relaxed text-midnight shadow-inner outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-glacier"
            />
            <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
              <p id="routine-input-hint" className="text-xs leading-relaxed text-muted-foreground">
                One product or INCI list per line. Add “AM” or “PM” if you only paste one half of
                your routine.
              </p>
              <span className="text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                {text.length}/4000
              </span>
            </div>
            {error && (
              <p
                id="routine-input-error"
                role="alert"
                className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
              >
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-700/90"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Analyze my routine
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={!text && !analysis}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>

            {stale && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                The text changed — run the analysis again to refresh the report.
              </p>
            )}
          </form>

          <div className="mt-6 border-t border-border/70 pt-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-glacier">
              Or start from a preset
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="group flex items-start gap-2.5 rounded-2xl border border-border bg-white px-3 py-2.5 text-left transition-colors hover:border-glacier/50 hover:bg-ice/60"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold leading-snug text-midnight">
                        {preset.title}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted-foreground">
                        {preset.note}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-[0.68rem] leading-relaxed text-muted-foreground">
            <Leaf className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            No account, no upload. The text stays in this browser tab.
          </p>
        </section>

        <div ref={resultRef} className="scroll-mt-24">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-glacier">
            02 · Report
          </p>
          {analysis ? <ResultDisplay analysis={analysis} /> : <EmptyReport />}
        </div>
      </div>

      {analysis && (
        <section aria-labelledby="routine-products-title" className="scroll-mt-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-glacier">
                03 · Catalog matches
              </p>
              <h2
                id="routine-products-title"
                className="mt-1 font-display text-2xl font-medium text-midnight sm:text-3xl"
              >
                What we would add — or swap in
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Chosen from the FrostDew catalog by your concerns and the gaps in your routine, not
                by paid placement. Each pick explains the formula and the evidence behind it.
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-winter">
              <Sparkles className="h-3.5 w-3.5 text-amber-cta" aria-hidden="true" />
              {suggestions.length} editorial match{suggestions.length === 1 ? "" : "es"}
            </p>
          </div>

          {suggestions.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <ProductSuggestion key={suggestion.product.id} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-border bg-white/70 p-5 text-sm text-muted-foreground">
              We could not find a confident catalog match for this routine. Try adding a concern or
              product name, or browse the full collection.
            </p>
          )}

          <p className="mt-4 rounded-2xl border border-border bg-white/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {AFFILIATE_PROXIMITY_NOTE} Prices and availability change; always verify on the store
            page. Recommendations are editorial and do not imply that a product treats a medical
            condition.
          </p>
        </section>
      )}

      <DailyQA today={today} />

      <section
        aria-labelledby="routine-disclaimer-title"
        className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm sm:p-7"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="routine-disclaimer-title"
              className="font-display text-xl font-medium text-amber-950 sm:text-2xl"
            >
              Educational tool, not medical advice
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
              The Routine Decoder teaches general sequencing and ingredient principles. It does
              not diagnose or treat acne, rosacea, eczema, pigmentation, allergies or any other
              condition, and it cannot account for your prescriptions or full medical history.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-amber-950/80">
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Patch test new products on the inner forearm for 24–48 hours before using them on
                your face.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                If you are pregnant, breastfeeding, using prescription retinoids, or managing a
                skin condition, ask a clinician before changing actives.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Stop any product that causes swelling, hives, blistering or persistent burning, and
                seek medical care if needed.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                For persistent acne, redness, eczema or a reaction that does not settle, see a
                board-certified dermatologist.
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-amber-950/70">
              Some store links are affiliate links. If you buy through them, FrostDew may earn a
              commission at no extra cost to you. See the{" "}
              <a
                href="/affiliate-disclosure"
                className="font-semibold underline underline-offset-2 hover:text-amber-950"
              >
                affiliate disclosure
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
