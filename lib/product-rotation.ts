import "server-only"

import { type Product } from "@/lib/products"
import { seededShuffle } from "@/lib/seeded-shuffle"

/** Newly added products are pinned to the top for this many hours. */
export const NEW_PRODUCT_HOURS = 36

/** Older products rotate on this cadence (two windows per day). */
export const ROTATION_HOURS = 12

const MS_IN_HOUR = 60 * 60 * 1000

function addedTimestamp(product: Product): number {
  // addedDate is stored as YYYY-MM-DD; parse at UTC midnight so "today" is
  // consistent regardless of the visitor's timezone.
  return product.addedDate ? Date.parse(`${product.addedDate}T00:00:00Z`) || 0 : 0
}

/**
 * Orders the homepage product grid:
 *  1. Products added within the last 36h are pinned to the top, newest first.
 *  2. Everything else is shuffled with a seed that changes every 12h, so the
 *     order is identical for every visitor inside a rotation window.
 *
 * This only affects display order. No product is hidden, removed, or altered.
 */
export function getOrderedProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return []

  const now = Date.now()
  const newCutoff = now - NEW_PRODUCT_HOURS * MS_IN_HOUR
  const rotationSeed = Math.floor(now / (ROTATION_HOURS * MS_IN_HOUR))

  const fresh: Product[] = []
  const pool: Product[] = []
  for (const product of products) {
    if (addedTimestamp(product) >= newCutoff) fresh.push(product)
    else pool.push(product)
  }

  // Newest first within the pinned group.
  fresh.sort((a, b) => addedTimestamp(b) - addedTimestamp(a))

  return [...fresh, ...seededShuffle(pool, rotationSeed)]
}