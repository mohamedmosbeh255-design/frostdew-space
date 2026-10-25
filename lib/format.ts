/**
 * Presentation helpers shared by the storefront and the admin prototype.
 *
 * This module deliberately imports no product data, so client components can
 * format values without pulling the whole products.json bundle into the browser.
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

const STORE_LABELS: Record<string, string> = {
  Amazon: "Amazon US",
  "Amazon UK": "Amazon UK",
  Stylevana: "Stylevana",
}

export function storeLabel(store: string): string {
  return STORE_LABELS[store] ?? store
}

export function formatAddedDate(iso: string): string | null {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return addedDateFormatter.format(date)
}

export function reviewCountLabel(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? "review" : "reviews"}`
}
