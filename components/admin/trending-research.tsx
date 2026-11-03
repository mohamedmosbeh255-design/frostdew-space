"use client"

import { cloneElement, useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  FileText,
  History,
  Info,
  ListOrdered,
  Minus,
  RefreshCw,
  ShieldCheck,
  ShieldQuestion,
  TrendingUp,
} from "lucide-react"
import OptimizedImage from "@/components/ui/OptimizedImage"
import {
  TRENDING_HISTORY_KEY,
  TRENDING_HISTORY_LIMIT,
  TRENDING_PAGE_SIZE,
  TRENDING_VERIFICATION_KEY,
  analyzeTrend,
  formatAnalysisTime,
  formatUpdated,
  formatWeek,
  isAnalysisRecord,
  productSnippet,
  type AnalysisRecord,
  type TrendAnalysis,
  type TrendDirection,
  type TrendingData,
  type TrendingProduct,
} from "@/lib/admin/trending"

const DISCLAIMER =
  "All products require manual verification before publishing. This tool provides suggestions only, not recommendations."

const QUICK_START_STEPS = [
  "Select 5 products using the checkboxes",
  'Click "Copy selected JSON"',
  "Paste into Add Product form",
] as const

type CopyState = "idle" | "copied" | "error"

const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`

function Tooltip({
  label,
  children,
  align = "center",
}: {
  label: string
  children: ReactElement<{ "aria-describedby"?: string }>
  align?: "start" | "center" | "end"
}) {
  const tooltipId = useId()
  const alignment =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"

  return (
    <span className="group/tooltip relative inline-flex">
      {cloneElement(children, { "aria-describedby": tooltipId })}
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-40 mb-2 w-max max-w-56 rounded-lg bg-midnight px-2.5 py-1.5 text-center text-[0.65rem] font-semibold leading-relaxed text-snow opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${alignment}`}
      >
        {label}
      </span>
    </span>
  )
}

const directionStyles: Record<TrendDirection, string> = {
  rising: "border-emerald-300 bg-emerald-50 text-emerald-800",
  falling: "border-rose-300 bg-rose-50 text-rose-800",
  steady: "border-slate-300 bg-slate-50 text-slate-700",
}

const directionBarStyles: Record<TrendDirection, string> = {
  rising: "bg-emerald-500",
  falling: "bg-rose-500",
  steady: "bg-glacier",
}

const directionPanelStyles: Record<TrendDirection, string> = {
  rising: "border-emerald-200 bg-emerald-50/60",
  falling: "border-rose-200 bg-rose-50/60",
  steady: "border-winter/15 bg-ice/40",
}

function DirectionIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "rising") return <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
  if (direction === "falling") return <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
  return <Minus className="h-3 w-3" aria-hidden="true" />
}

function directionLabel(direction: TrendDirection) {
  if (direction === "rising") return "Rising"
  if (direction === "falling") return "Falling"
  return "Steady"
}

function DirectionBadge({
  direction,
  value,
}: {
  direction: TrendDirection
  value: number
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] ${directionStyles[direction]}`}
    >
      <DirectionIcon direction={direction} />
      {directionLabel(direction)} {signed(value)}
    </span>
  )
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span
      title={verified ? "Manually confirmed in this browser" : "Not yet confirmed"}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] ${
        verified
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-800"
      }`}
    >
      {verified ? (
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ShieldQuestion className="h-3 w-3" aria-hidden="true" />
      )}
      {verified ? "Verified" : "Needs manual review"}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 px-2.5 py-2">
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg leading-none text-midnight tabular-nums">{value}</p>
    </div>
  )
}

function AnalysisPanel({
  product,
  analysis,
}: {
  product: TrendingProduct
  analysis: TrendAnalysis
}) {
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${directionPanelStyles[analysis.direction]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-midnight">
          <TrendingUp className="h-4 w-4 text-winter" aria-hidden="true" />
          Weekly trend
        </h4>
        <DirectionBadge direction={analysis.direction} value={analysis.fourWeekChange} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Latest" value={analysis.latest} />
        <Stat label="vs last week" value={signed(analysis.change)} />
        <Stat label="4-week move" value={signed(analysis.fourWeekChange)} />
        <Stat label="Average" value={analysis.average} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-midnight/80">{analysis.summary}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left text-xs">
          <caption className="sr-only">Weekly interest scores for {product.name}</caption>
          <thead className="text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 pr-3 font-bold">Week</th>
              <th scope="col" className="py-1 pr-3 font-bold">Score</th>
              <th scope="col" className="py-1 font-bold">Change</th>
            </tr>
          </thead>
          <tbody>
            {analysis.weeks.map((week) => (
              <tr key={week.week} className="border-t border-winter/10">
                <td className="whitespace-nowrap py-1.5 pr-3 text-muted-foreground">
                  <time dateTime={week.week}>{formatWeek(week.week)}</time>
                </td>
                <td className="py-1.5 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-20 overflow-hidden rounded-full bg-white/90"
                    >
                      <span
                        className={`block h-full rounded-full ${directionBarStyles[analysis.direction]}`}
                        style={{ width: `${Math.max(0, Math.min(100, week.score))}%` }}
                      />
                    </span>
                    <span className="font-semibold tabular-nums text-midnight">{week.score}</span>
                  </div>
                </td>
                <td className="py-1.5 tabular-nums text-midnight/80">
                  {week.delta === null ? "—" : signed(week.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
        Calculated only from the weekly scores in <code>data/trending.json</code> when you pressed
        Analyze. It is not a live source and it does not approve the product.
      </p>

      {product.notes && (
        <p className="mt-2 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs leading-relaxed text-midnight/75">
          <span className="font-bold">Research note: </span>
          {product.notes}
        </p>
      )}
    </div>
  )
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.top = "0"
    area.style.left = "0"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand("copy")
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

export default function TrendingResearch({ data }: { data: TrendingData }) {
  const products = data.products

  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [analyses, setAnalyses] = useState<Record<string, TrendAnalysis>>({})
  const [verifiedIds, setVerifiedIds] = useState<string[]>([])
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const [copyMessage, setCopyMessage] = useState("")
  const [focusProductId, setFocusProductId] = useState<string | null>(null)

  const selectAllRef = useRef<HTMLInputElement>(null)

  const pageCount = Math.max(1, Math.ceil(products.length / TRENDING_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * TRENDING_PAGE_SIZE
  const visibleProducts = products.slice(startIndex, startIndex + TRENDING_PAGE_SIZE)
  const visibleIds = visibleProducts.map((product) => product.id)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const verifiedSet = useMemo(() => new Set(verifiedIds), [verifiedIds])

  const allVisibleSelected =
    visibleProducts.length > 0 && visibleProducts.every((product) => selectedSet.has(product.id))
  const someVisibleSelected = visibleProducts.some((product) => selectedSet.has(product.id))
  const verifiedCount = products.filter((product) => verifiedSet.has(product.id)).length

  // Restore browser-local state only after mount so server and client HTML match.
  useEffect(() => {
    try {
      const rawVerification = window.localStorage.getItem(TRENDING_VERIFICATION_KEY)
      if (rawVerification) {
        const parsed: unknown = JSON.parse(rawVerification)
        if (Array.isArray(parsed)) {
          setVerifiedIds(parsed.filter((value): value is string => typeof value === "string"))
        }
      }

      const rawHistory = window.localStorage.getItem(TRENDING_HISTORY_KEY)
      if (rawHistory) {
        const parsed: unknown = JSON.parse(rawHistory)
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter(isAnalysisRecord).slice(0, TRENDING_HISTORY_LIMIT))
        }
      }
    } catch {
      // Corrupt or blocked storage should not break the research page.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(TRENDING_VERIFICATION_KEY, JSON.stringify(verifiedIds))
    } catch {
      // Storage may be full or disabled; the UI keeps working for this session.
    }
  }, [storageReady, verifiedIds])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(TRENDING_HISTORY_KEY, JSON.stringify(history))
    } catch {
      // Storage may be full or disabled; the UI keeps working for this session.
    }
  }, [history, storageReady])

  // Native checkboxes need the indeterminate flag set imperatively.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected
    }
  }, [allVisibleSelected, someVisibleSelected])

  useEffect(() => {
    if (!focusProductId) return
    const element = document.getElementById(`trending-product-${focusProductId}`)
    if (!element) return
    element.scrollIntoView({ behavior: "smooth", block: "center" })
    setFocusProductId(null)
  }, [currentPage, focusProductId])

  const clearCopyMessage = () => {
    setCopyState("idle")
    setCopyMessage("")
  }

  const toggleSelected = (id: string) => {
    clearCopyMessage()
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    )
  }

  const togglePageSelection = () => {
    clearCopyMessage()
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return Array.from(next)
    })
  }

  const clearSelection = () => {
    clearCopyMessage()
    setSelectedIds([])
  }

  const copySelected = async () => {
    const chosen = products.filter((product) => selectedSet.has(product.id))
    if (chosen.length === 0) {
      setCopyState("error")
      setCopyMessage("Select at least one product before copying.")
      return
    }

    const payload = chosen.length === 1 ? productSnippet(chosen[0]) : chosen.map(productSnippet)
    const copied = await writeClipboard(JSON.stringify(payload, null, 2))

    if (copied) {
      setCopyState("copied")
      setCopyMessage(
        `Copied ${chosen.length} product${chosen.length === 1 ? "" : "s"} as JSON. Paste into Add Product manually.`,
      )
    } else {
      setCopyState("error")
      setCopyMessage("Could not access the clipboard. Copy the snippet from the browser dev tools instead.")
    }
  }

  const analyzeProduct = (product: TrendingProduct) => {
    const analysis = analyzeTrend(product)
    setAnalyses((previous) => ({ ...previous, [product.id]: analysis }))

    const record: AnalysisRecord = {
      id: `${product.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      productId: product.id,
      brand: product.brand,
      name: product.name,
      analyzedAt: new Date().toISOString(),
      latest: analysis.latest,
      change: analysis.change,
      fourWeekChange: analysis.fourWeekChange,
      direction: analysis.direction,
    }

    setHistory((previous) => [record, ...previous].slice(0, TRENDING_HISTORY_LIMIT))
  }

  const toggleVerification = (product: TrendingProduct) => {
    const verified = verifiedSet.has(product.id)

    if (verified) {
      setVerifiedIds((previous) => previous.filter((id) => id !== product.id))
      return
    }

    const confirmed = window.confirm(
      `Mark "${product.brand} ${product.name}" as verified?\n\nOnly confirm after you have manually checked the live listing and product details.`,
    )
    if (!confirmed) return

    setVerifiedIds((previous) =>
      previous.includes(product.id) ? previous : [...previous, product.id],
    )
  }

  const openHistoryRecord = (record: AnalysisRecord) => {
    const product = products.find((entry) => entry.id === record.productId)
    if (!product) return

    setAnalyses((previous) => ({ ...previous, [product.id]: analyzeTrend(product) }))
    const index = products.findIndex((entry) => entry.id === product.id)
    setPage(Math.floor(index / TRENDING_PAGE_SIZE) + 1)
    setFocusProductId(product.id)
  }

  const clearHistory = () => {
    if (!window.confirm("Clear the browser-local analysis history?")) return
    setHistory([])
  }

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, pageCount)))
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-glacier">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Research desk
          </p>
          <h1 className="mt-1 font-display text-2xl text-midnight sm:text-3xl">
            Trending Products Research
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manually curated weekly interest scores. Review every product yourself before it goes
            anywhere near the catalog.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-2.5 py-1 font-semibold text-winter">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Source: data/trending.json
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-2.5 py-1 font-semibold text-muted-foreground">
            Updated {formatUpdated(data.updatedAt)}
          </span>
        </div>
      </header>

      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm"
      >
        <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold leading-relaxed">{DISCLAIMER}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
            Nothing here is published or approved automatically. A product only becomes
            &ldquo;Verified&rdquo; after you confirm it in this browser.
          </p>
        </div>
      </div>

      <section
        aria-labelledby="quick-start-title"
        className="rounded-2xl border border-winter/15 bg-white/75 p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ice text-winter">
              <ListOrdered className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="quick-start-title" className="font-display text-lg text-midnight">
                Quick Start
              </h2>
              <p className="text-xs text-muted-foreground">
                From research to the Add Product form in three steps.
              </p>
            </div>
          </div>
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-glacier">
            3 steps
          </span>
        </div>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {QUICK_START_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-white/70 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-midnight text-[0.65rem] font-bold text-snow">
                {index + 1}
              </span>
              <p className="text-xs font-semibold leading-relaxed text-midnight">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {data.note && (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-white/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-glacier" aria-hidden="true" />
          <span>{data.note}</span>
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white/80 px-3.5 py-3">
            <label className="flex items-center gap-2 text-xs font-bold text-midnight">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={togglePageSelection}
                disabled={visibleProducts.length === 0}
                className="h-4 w-4 rounded border-input text-winter accent-winter focus:ring-winter"
              />
              Select page
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedIds.length} selected · {verifiedCount} verified in this browser
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Tooltip label="Copies selected products to clipboard for adding to catalog">
                <button
                  type="button"
                  onClick={copySelected}
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-2 text-xs font-bold text-snow transition-colors hover:bg-winter disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy selected JSON
                </button>
              </Tooltip>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedIds.length === 0}
                className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear selection
              </button>
            </div>
          </div>

          {(copyState === "copied" || copyState === "error") && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                copyState === "copied"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {copyState === "copied" ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {copyMessage}
            </p>
          )}

          <ul className="mt-3 flex flex-col gap-3">
            {visibleProducts.map((product) => {
              const selected = selectedSet.has(product.id)
              const verified = verifiedSet.has(product.id)
              const analysis = analyses[product.id]

              return (
                <li
                  key={product.id}
                  id={`trending-product-${product.id}`}
                  className={`rounded-3xl border bg-white/85 p-4 shadow-sm transition-shadow sm:p-5 ${
                    selected ? "border-winter/40 ring-1 ring-winter/20" : "border-white/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(product.id)}
                      aria-label={`Select ${product.brand} ${product.name}`}
                      className="mt-1.5 h-4 w-4 shrink-0 rounded border-input text-winter accent-winter focus:ring-winter"
                    />
                    <OptimizedImage
                      src={product.image}
                      alt={`${product.brand} ${product.name}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 shrink-0 rounded-2xl border border-border bg-white p-1.5"
                      imageClassName="h-full w-full object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-glacier">
                            {product.brand}
                          </p>
                          <h3 className="mt-0.5 font-display text-lg leading-snug text-midnight">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.store} · {product.categories.join(", ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {product.bestseller && (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-amber-800">
                              Bestseller
                            </span>
                          )}
                          <StatusBadge verified={verified} />
                        </div>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {product.short}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Tooltip label="Shows trend data for this product">
                          <button
                            type="button"
                            onClick={() => analyzeProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-1.5 text-xs font-bold text-snow transition-colors hover:bg-winter"
                          >
                            {analysis ? (
                              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {analysis ? "Re-analyze" : "Analyze"}
                          </button>
                        </Tooltip>
                        <Tooltip
                          align="end"
                          label={
                            verified
                              ? "Returns this product to Needs manual review"
                              : "Confirms this product is ready to publish"
                          }
                        >
                          <button
                            type="button"
                            onClick={() => toggleVerification(product)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                              verified
                                ? "border-border bg-white text-muted-foreground hover:bg-muted"
                                : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                            }`}
                          >
                            {verified ? (
                              <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {verified ? "Reset to needs review" : "Mark verified"}
                          </button>
                        </Tooltip>
                        <Tooltip label="Opens the product page on the public site" align="end">
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-winter underline decoration-winter/30 underline-offset-4 transition-colors hover:text-midnight"
                          >
                            Open listing
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {analysis && <AnalysisPanel product={product} analysis={analysis} />}
                </li>
              )
            })}
          </ul>

          {visibleProducts.length === 0 && (
            <div className="mt-3 rounded-3xl border border-dashed border-border bg-white/60 px-5 py-10 text-center">
              <TrendingUp className="mx-auto h-6 w-6 text-glacier" aria-hidden="true" />
              <p className="mt-2 font-display text-lg text-midnight">No products in the file</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add entries to <code>data/trending.json</code>, then reload this page.
              </p>
            </div>
          )}

          <nav
            aria-label="Trending product pages"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/75 px-3.5 py-3"
          >
            <p className="text-xs text-muted-foreground">
              {products.length === 0
                ? "0 products"
                : `Showing ${startIndex + 1}–${Math.min(startIndex + TRENDING_PAGE_SIZE, products.length)} of ${products.length}`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => goToPage(number)}
                  aria-current={number === currentPage ? "page" : undefined}
                  aria-label={`Page ${number}`}
                  className={
                    number === currentPage
                      ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-midnight px-2 text-xs font-bold text-snow"
                      : "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-border bg-white px-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
                  }
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                aria-label="Next page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-display text-lg text-midnight">
                <History className="h-4 w-4 text-winter" aria-hidden="true" />
                Last 5 analyses
              </h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-full px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground transition-colors hover:bg-ice hover:text-winter"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Stored in this browser only.
            </p>

            <ol className="mt-3 space-y-2">
              {history.map((record) => {
                const available = products.some((product) => product.id === record.productId)
                return (
                  <li
                    key={record.id}
                    className="rounded-2xl border border-border bg-white/85 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-glacier">
                          {record.brand}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-midnight">
                          {record.name}
                        </p>
                      </div>
                      <DirectionBadge
                        direction={record.direction}
                        value={record.fourWeekChange}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <time
                        dateTime={record.analyzedAt}
                        title={new Date(record.analyzedAt).toLocaleString("en-US")}
                        className="text-[0.65rem] text-muted-foreground"
                      >
                        {formatAnalysisTime(record.analyzedAt)} · latest {record.latest}
                      </time>
                      <button
                        type="button"
                        onClick={() => openHistoryRecord(record)}
                        disabled={!available}
                        className="whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-[0.65rem] font-semibold text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {available ? "View" : "Not in file"}
                      </button>
                    </div>
                  </li>
                )
              })}
              {history.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border bg-white/60 px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                  No analyses yet. Press Analyze on a product to record one.
                </li>
              )}
            </ol>
          </section>

          <section className="rounded-3xl border border-white/80 bg-white/75 p-4 text-xs leading-relaxed text-muted-foreground shadow-sm">
            <h2 className="font-display text-lg text-midnight">How this works</h2>
            <ul className="mt-2 list-disc space-y-2 pl-4">
              <li>
                Reads only <code className="rounded bg-ice px-1 text-midnight">data/trending.json</code>.
                No live Google Trends or Amazon data requests.
              </li>
              <li>
                Every product starts as <strong className="text-midnight">Needs manual review</strong>.
                Verified is a browser-local note, not a publish action.
              </li>
              <li>Analysis runs only when you press Analyze, and history keeps the last five runs.</li>
              <li>
                Copy the selected snippet and paste it into Add Product yourself. Nothing is
                created or published automatically.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
