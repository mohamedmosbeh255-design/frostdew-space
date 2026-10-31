import "server-only"

import { rowToProduct } from "@/lib/product-row.mjs"
import { CATEGORIES, type Product } from "@/lib/products"
import { getSupabasePublicClient } from "@/lib/supabase"

/**
 * Server-side catalog search.
 *
 * The app's `public.products` table differs from the shape in the original
 * snippet: there is no `slug`, `category`, `inStock`, or `reviews` relation.
 * Product ids are the slugs, categories are a `text[]`, and ratings/review
 * counts live on the product row. This module maps to the real schema and
 * returns camelCase `Product` objects instead of raw rows.
 */

export class SearchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "SearchError"
  }
}

/** Columns searched by the free-text part of the query. */
const TEXT_COLUMNS = ["brand", "name", "full_name", "short", "description"] as const

/** Product field -> database column. */
const FILTER_COLUMNS = {
  id: "id",
  brand: "brand",
  name: "name",
  fullName: "full_name",
  categories: "categories",
  short: "short",
  description: "description",
  features: "features",
  image: "image",
  images: "images",
  url: "url",
  store: "store",
  bestseller: "bestseller",
  price: "price",
  salePrice: "sale_price",
  rating: "rating",
  reviewCount: "review_count",
  addedDate: "added_date",
  affiliateLinks: "affiliate_links",
  relatedProducts: "related_products",
} as const satisfies Record<keyof Product, string>

/** Array columns use overlap (`&&`), not `in (…)`. */
const ARRAY_FILTERS = new Set<keyof Product>([
  "categories",
  "features",
  "images",
  "relatedProducts",
])

/**
 * PostgREST splits `or=(…)` on commas and treats `%`/`_` as ILIKE wildcards.
 * Stripping those characters (and the quote/escape characters) keeps the
 * filter grammar intact; `100%` still searches for `100`.
 */
function sanitizeSearchTerm(query: string): string | null {
  const cleaned = query
    .replace(/["\\%_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned.length > 0 ? cleaned : null
}

export async function searchProducts(
  query: string,
  filters?: Partial<Product>,
): Promise<Product[]> {
  const term = sanitizeSearchTerm(query.trim())

  // A query made only of wildcard/quote characters has no meaningful term.
  if (query.trim() && !term) return []

  let productQuery = getSupabasePublicClient().from("products").select("*")

  if (term) {
    const pattern = `"%${term}%"`

    // The original snippet mixed `*` and `%` wildcards. PostgREST accepts `%`
    // inside a quoted value, which also protects commas in product names.
    const conditions = TEXT_COLUMNS.map((column) => `${column}.ilike.${pattern}`)

    // Categories are a text[] column. Match the ids whose slug or label
    // contains the term, so "lip care" and "lip-care" both work.
    const needle = term.toLowerCase()
    for (const category of CATEGORIES) {
      if (
        category.id.includes(needle) ||
        category.label.toLowerCase().includes(needle)
      ) {
        conditions.push(`categories.cs.{${category.id}}`)
      }
    }

    productQuery = productQuery.or(conditions.join(","))
  }

  if (filters) {
    for (const [key, value] of Object.entries(filters) as [
      keyof Product,
      Product[keyof Product] | undefined,
    ][]) {
      if (value === undefined || value === null || value === "") continue

      const column = FILTER_COLUMNS[key]
      if (!column) continue

      if (Array.isArray(value)) {
        if (value.length === 0) continue
        productQuery = productQuery.overlaps(column, value)
      } else if (key === "affiliateLinks") {
        productQuery = productQuery.contains(column, value as Record<string, unknown>)
      } else {
        productQuery = productQuery.eq(column, value)
      }
    }
  }

  // `sort_order` is the curated catalog order used by the shop. `created_at`
  // would surface the admin's newest insert rather than the featured order.
  const { data, error } = await productQuery
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    console.error("[search] Unable to search products.", error)
    throw new SearchError("Unable to search products.", { cause: error })
  }

  return (data ?? []).map((row) => rowToProduct(row))
}

/**
 * Product ids double as URL slugs, so the lookup is by `id`.
 * Returns null for a missing product so pages can render notFound().
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await getSupabasePublicClient()
    .from("products")
    .select("*")
    .eq("id", slug)
    .maybeSingle()

  if (error) {
    console.error("[search] Unable to load product.", error)
    throw new SearchError("Unable to load product.", { cause: error })
  }

  return data ? rowToProduct(data) : null
}
