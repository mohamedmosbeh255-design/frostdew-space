"use client"

import { useState } from "react"
import { Beaker, Eraser, ListChecks, Sparkles, Wand2 } from "lucide-react"

const EXAMPLE =
  "Water, Glycerin, Butylene Glycol, Niacinamide, Sodium Hyaluronate, Ceramide NP, Panthenol, Allantoin, Carbomer, Xanthan Gum, Disodium EDTA, Ethylhexylglycerin, Phenoxyethanol"

type ParsedIngredient = {
  position: number
  name: string
}

function parseIngredients(value: string): ParsedIngredient[] {
  return value
    .split(/[\n,;•]+/)
    .map((item) =>
      item
        .replace(/^\s*ingredients?\s*:\s*/i, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/^[-–—*]\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .map((name, index) => ({ position: index + 1, name }))
}

export default function AnalyzerForm() {
  const [text, setText] = useState("")
  const [ingredients, setIngredients] = useState<ParsedIngredient[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseIngredients(text)

    if (parsed.length === 0) {
      setIngredients(null)
      setError("Paste an INCI ingredient list to analyze.")
      return
    }

    setIngredients(parsed)
    setError(null)
  }

  const clear = () => {
    setText("")
    setIngredients(null)
    setError(null)
  }

  const loadExample = () => {
    setText(EXAMPLE)
    setIngredients(null)
    setError(null)
  }

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
      <section
        aria-labelledby="analyzer-input-title"
        className="rounded-3xl border border-cyan-200/15 bg-white/[0.04] p-5 shadow-[0_24px_70px_-40px_rgba(34,211,238,0.45)] sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cyan-300">
              01 · Input
            </p>
            <h2
              id="analyzer-input-title"
              className="mt-1 font-display text-2xl font-medium text-white"
            >
              Paste an ingredient list
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-cyan-200">
            <ListChecks className="h-3 w-3" aria-hidden="true" />
            Runs locally
          </span>
        </div>

        <form onSubmit={analyze} className="mt-4">
          <label htmlFor="inci-input" className="sr-only">
            INCI ingredient list
          </label>
          <textarea
            id="inci-input"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              if (error) setError(null)
            }}
            rows={10}
            maxLength={8000}
            placeholder="Water, Glycerin, Niacinamide, Sodium Hyaluronate, Ceramide NP…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "inci-input-error" : "inci-input-hint"}
            className="w-full resize-y rounded-2xl border border-white/10 bg-midnight/70 px-3.5 py-3 text-sm leading-relaxed text-ice shadow-inner outline-none placeholder:text-ice/30 focus-visible:border-cyan-300/50 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
          />
          <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
            <p id="inci-input-hint" className="text-xs leading-relaxed text-ice/50">
              Separate ingredients with commas or new lines. Copy the list exactly as it appears on
              the label.
            </p>
            <span className="text-[0.65rem] font-semibold tabular-nums text-ice/40">
              {text.length}/8000
            </span>
          </div>
          {error && (
            <p
              id="inci-input-error"
              role="alert"
              className="mt-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-midnight shadow-sm transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              Analyze
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={!text && !ingredients}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-ice transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
            <button
              type="button"
              onClick={loadExample}
              className="text-xs font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200"
            >
              Try an example
            </button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="analyzer-results-title"
        aria-live="polite"
        className="rounded-3xl border border-cyan-200/15 bg-white/[0.04] p-5 shadow-[0_24px_70px_-40px_rgba(34,211,238,0.45)] sm:p-6"
      >
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cyan-300">
          02 · Result
        </p>
        <h2
          id="analyzer-results-title"
          className="mt-1 font-display text-2xl font-medium text-white"
        >
          Ingredient breakdown
        </h2>

        {ingredients ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {ingredients.length} ingredient{ingredients.length === 1 ? "" : "s"} detected
              </span>
              <span className="text-xs text-ice/45">Listed in label order</span>
            </div>

            <ol className="mt-4 max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
              {ingredients.map((ingredient) => (
                <li
                  key={`${ingredient.position}-${ingredient.name}`}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-midnight/40 px-3 py-2"
                >
                  <span className="mt-0.5 w-6 shrink-0 text-right text-[0.65rem] font-bold tabular-nums text-cyan-300/80">
                    {ingredient.position}
                  </span>
                  <span className="text-sm leading-relaxed text-ice/85">{ingredient.name}</span>
                </li>
              ))}
            </ol>

            <p className="mt-4 rounded-2xl border border-white/10 bg-midnight/40 px-3.5 py-3 text-xs leading-relaxed text-ice/50">
              This first version separates and counts the list. Ingredient-by-ingredient
              explanations are coming next — it does not yet judge whether a formula is right for
              your skin.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/20 bg-midnight/30 px-5 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/25">
              <Beaker className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-lg font-medium text-white">
              Your ingredients will appear here
            </p>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ice/50">
              Paste a label, then press Analyze. Nothing leaves this browser tab.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
