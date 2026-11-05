import { formatPrice, parsePrice } from "@/lib/format"
import type { Locale } from "@/lib/i18n"
import type { Currency } from "@/lib/regions"

/**
 * Approximate display rates, expressed as units per US dollar.
 *
 * Catalog prices come from different stores and currencies. These rates are
 * only used for the localized "approximate" label on the storefront; the
 * checkout price always comes from the retailer.
 */
const UNITS_PER_USD: Record<Currency | "JPY" | "INR", number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.37,
  KRW: 1380,
  JPY: 150,
  INR: 83,
}

const SYMBOL_TO_CURRENCY: Record<string, Currency | "JPY" | "INR"> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "₩": "KRW",
  "¥": "JPY",
  "₹": "INR",
}

/**
 * Constructing an Intl formatter is expensive. A catalog page renders dozens
 * of prices during hydration, so cache one formatter per locale/currency pair.
 */
const formatters = new Map<string, Intl.NumberFormat | null>()

function getFormatter(
  locale: Locale,
  currency: Currency,
  fractionDigits: number,
): Intl.NumberFormat | null {
  const key = `${locale}|${currency}|${fractionDigits}`
  const cached = formatters.get(key)
  if (cached !== undefined) return cached

  let formatter: Intl.NumberFormat | null
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
  } catch {
    formatter = null
  }
  formatters.set(key, formatter)
  return formatter
}

export function convertAmount(
  amount: number,
  from: Currency | "JPY" | "INR",
  to: Currency,
): number {
  if (from === to) return amount
  return (amount / UNITS_PER_USD[from]) * UNITS_PER_USD[to]
}

/** Format a stored price string in the shopper's selected display currency. */
export function formatDisplayPrice(value: string, target: Currency, locale: Locale): string {
  const parsed = parsePrice(value)
  if (!parsed) return formatPrice(value)

  const source = SYMBOL_TO_CURRENCY[parsed.currency]
  if (!source) return formatPrice(value)

  const amount = convertAmount(parsed.amount, source, target)
  const fractionDigits = target === "KRW" ? 0 : 2
  const formatter = getFormatter(locale, target, fractionDigits)
  return formatter ? `~${formatter.format(amount)}` : formatPrice(value)
}
