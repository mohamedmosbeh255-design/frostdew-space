import { CATEGORIES, type Product } from "@/lib/products"
import { parsePrice } from "@/lib/format"

/**
 * Shop query state lives in the URL so the home page can run the catalog query
 * on the server. These helpers are shared by the server page (parsing
 * `searchParams`) and the client shop (building the next URL).
 */

export const SHOP_SORTS = [
  "featured",
  "newest",
  "price-low",
  "price-high",
  "rating",
] as const

export type ShopSort = (typeof SHOP_SORTS)[number]

export type ShopFilters = {
  /** A `CATEGORIES` id, or "all". */
  category: string
  /** Inclusive upper bound of the effective price. */
  maxPrice: number
  /** Minimum rating, 0 for any. */
  rating: number
  sort: ShopSort
}

export type ShopQuery = {
  q: string
  filters: ShopFilters
}

/** Parsed before the catalog price ceiling is known. */
export type ParsedShopQuery = {
  q: string
  filters: Omit<ShopFilters, "maxPrice"> & { maxPrice: number | null }
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizeQuery(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

export function parseShopQuery(
  params: Record<string, string | string[] | undefined>,
): ParsedShopQuery {
  const categoryParam = first(params.category)
  // The admin only allows `CATEGORIES` ids, so an unknown value is ignored
  // rather than rendering a select with no matching option.
  const category =
    categoryParam && categoryParam !== "all"
      ? CATEGORIES.find((entry) => entry.id === categoryParam)?.id
      : undefined

  const rawMaxPrice = Number(first(params.maxPrice))
  const maxPrice =
    first(params.maxPrice) !== undefined &&
    Number.isFinite(rawMaxPrice) &&
    rawMaxPrice >= 0
      ? Math.round(rawMaxPrice)
      : null

  const rawRating = Number(first(params.rating))
  const rating =
    Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : 0

  const rawSort = first(params.sort)

  return {
    q: normalizeQuery(first(params.q)),
    filters: {
      category: category ?? "all",
      maxPrice,
      rating,
      sort: SHOP_SORTS.includes(rawSort as ShopSort) ? (rawSort as ShopSort) : "featured",
    },
  }
}

/** The slider maximum: rounded up to the next $10, matching the old client filter. */
export function catalogMaxPrice(products: Product[]): number {
  let max = 0
  for (const product of products) {
    const parsed = parsePrice(product.salePrice ?? product.price ?? "")
    if (parsed && parsed.amount > max) max = parsed.amount
  }
  return max === 0 ? 0 : Math.max(10, Math.ceil(max / 10) * 10)
}

export function defaultShopFilters(maxPrice: number): ShopFilters {
  return { category: "all", maxPrice, rating: 0, sort: "featured" }
}

/** Only non-default values go into the URL, so the base shop stays at "/". */
export function shopHref(query: ShopQuery, maxCatalogPrice: number): string {
  const params = new URLSearchParams()
  const q = normalizeQuery(query.q)
  if (q) params.set("q", q)
  if (query.filters.category !== "all") params.set("category", query.filters.category)
  if (query.filters.maxPrice < maxCatalogPrice) {
    params.set("maxPrice", String(query.filters.maxPrice))
  }
  if (query.filters.rating > 0) params.set("rating", String(query.filters.rating))
  if (query.filters.sort !== "featured") params.set("sort", query.filters.sort)
  const search = params.toString()
  return search ? `/?${search}` : "/"
}
