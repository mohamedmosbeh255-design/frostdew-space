/**
 * Presentation helpers shared by the storefront and the admin prototype.
 *
 * This module deliberately imports no product data, so client components can
 * format values without pulling the whole catalog into the browser.
 */

const countFormatter = new Intl.NumberFormat("en-US")

const addedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatNumber(value: number): string {
  return countFormatter.format(value)
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/** Prices are stored with their currency symbol; "~" marks them as approximate. */
export function formatPrice(price: string): string {
  return `~${price}`
}

const PRICE_PARSE_PATTERN = /^([$£€¥₩₹])\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)$/

export type ParsedPrice = {
  currency: string
  amount: number
}

/** Parses the same currency formats the validator accepts. */
export function parsePrice(value: string): ParsedPrice | null {
  const match = PRICE_PARSE_PATTERN.exec(value.trim())
  if (!match) return null
  const amount = Number(match[2].replace(/,/g, ""))
  if (!Number.isFinite(amount)) return null
  return { currency: match[1], amount }
}

/** Rounded discount percentage, or null when the pair is not a valid discount. */
export function discountPercent(price: string, salePrice: string): number | null {
  const regular = parsePrice(price)
  const sale = parsePrice(salePrice)
  if (!regular || !sale) return null
  if (regular.currency !== sale.currency) return null
  if (sale.amount >= regular.amount) return null
  return Math.round((1 - sale.amount / regular.amount) * 100)
}

const STORE_LABELS: Record<string, string> = {
  Amazon: "Amazon US",
  "Amazon UK": "Amazon UK",
  Stylevana: "Stylevana",
}

export function storeLabel(store: string): string {
  return STORE_LABELS[store] ?? store
}

/**
 * Today's calendar date as `YYYY-MM-DD`, the format `addedDate` stores.
 * Uses local time when called in the browser so "today" matches the user's
 * clock rather than the server's UTC day.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatAddedDate(iso: string): string | null {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return addedDateFormatter.format(date)
}

export function reviewCountLabel(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? "review" : "reviews"}`
}
