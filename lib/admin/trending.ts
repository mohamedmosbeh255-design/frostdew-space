/** Types and pure helpers for the manually maintained trending research file. */

export const TRENDING_PAGE_SIZE = 5
export const TRENDING_HISTORY_LIMIT = 5
export const TRENDING_VERIFICATION_KEY = "frostdew.trending.verification.v1"
export const TRENDING_HISTORY_KEY = "frostdew.trending.history.v1"

export type TrendWeek = {
  /** ISO date for the start of the week, YYYY-MM-DD. */
  week: string
  /** Manual interest score from 0 to 100. */
  score: number
}

export type TrendingProduct = {
  id: string
  brand: string
  name: string
  fullName: string
  categories: string[]
  short: string
  description: string
  features: string[]
  image: string
  url: string
  store: string
  bestseller: boolean
  /** Free-form manual research notes shown in the analysis panel. */
  notes?: string
  weeks: TrendWeek[]
}

export type TrendingData = {
  updatedAt: string
  note?: string
  products: TrendingProduct[]
}

export type TrendDirection = "rising" | "falling" | "steady"

export type AnalyzedWeek = TrendWeek & {
  /** Change from the previous week, or null for the first entry. */
  delta: number | null
}

export type TrendAnalysis = {
  latest: number
  previous: number | null
  change: number
  fourWeekChange: number
  average: number
  peak: TrendWeek
  direction: TrendDirection
  summary: string
  weeks: AnalyzedWeek[]
}

export type ProductSnippet = Pick<
  TrendingProduct,
  | "id"
  | "brand"
  | "name"
  | "fullName"
  | "categories"
  | "short"
  | "description"
  | "features"
  | "image"
  | "url"
  | "store"
  | "bestseller"
>

/** One row in the browser-local analysis history. */
export type AnalysisRecord = {
  id: string
  productId: string
  brand: string
  name: string
  analyzedAt: string
  latest: number
  change: number
  fourWeekChange: number
  direction: TrendDirection
}

const DIRECTIONS: TrendDirection[] = ["rising", "falling", "steady"]

/** Guards history restored from localStorage against stale or edited values. */
export function isAnalysisRecord(value: unknown): value is AnalysisRecord {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.productId === "string" &&
    typeof record.brand === "string" &&
    typeof record.name === "string" &&
    typeof record.analyzedAt === "string" &&
    typeof record.latest === "number" &&
    typeof record.change === "number" &&
    typeof record.fourWeekChange === "number" &&
    DIRECTIONS.includes(record.direction as TrendDirection)
  )
}

const round = (value: number) => Math.round(value)

export function analyzeTrend(product: TrendingProduct): TrendAnalysis {
  const weeks = product.weeks
  const latest = weeks.at(-1)?.score ?? 0
  const previous = weeks.length > 1 ? weeks[weeks.length - 2].score : null
  const change = previous === null ? 0 : latest - previous
  const comparison = weeks[Math.max(0, weeks.length - 5)] ?? weeks[0] ?? { week: "", score: latest }
  const fourWeekChange = latest - comparison.score
  const average = weeks.length
    ? round(weeks.reduce((total, week) => total + week.score, 0) / weeks.length)
    : 0
  const peak = weeks.reduce(
    (best, week) => (week.score > best.score ? week : best),
    weeks[0] ?? { week: "", score: latest },
  )

  const direction: TrendDirection =
    fourWeekChange >= 5 ? "rising" : fourWeekChange <= -5 ? "falling" : "steady"

  const summary =
    weeks.length < 2
      ? "Not enough weekly points to read a trend yet."
      : direction === "rising"
        ? `Interest is up ${fourWeekChange} points over the four-week window, with the latest score at ${latest}. Confirm the movement with an independent source before acting on it.`
        : direction === "falling"
          ? `Interest is down ${Math.abs(fourWeekChange)} points over the four-week window, with the latest score at ${latest}. Check whether the decline is seasonal before dropping the product.`
          : `Interest is holding near ${latest}, a ${fourWeekChange >= 0 ? "+" : ""}${fourWeekChange}-point move over four weeks. There is no clear direction yet.`

  return {
    latest,
    previous,
    change,
    fourWeekChange,
    average,
    peak,
    direction,
    summary,
    weeks: weeks.map((week, index) => ({
      ...week,
      delta: index === 0 ? null : week.score - weeks[index - 1].score,
    })),
  }
}

/** The Add Product form payload shape, without research-only fields. */
export function productSnippet(product: TrendingProduct): ProductSnippet {
  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    fullName: product.fullName,
    categories: product.categories,
    short: product.short,
    description: product.description,
    features: product.features,
    image: product.image,
    url: product.url,
    store: product.store,
    bestseller: product.bestseller,
  }
}

export function formatWeek(week: string): string {
  if (!week) return "—"
  return new Date(`${week}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function formatUpdated(value: string): string {
  if (!value) return "Not set"
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** Local time is only formatted on the client, after localStorage has loaded. */
export function formatAnalysisTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown time"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
