import type { Product } from "@/lib/products"

/**
 * Returns the ordered, de-duplicated gallery for a product.
 * The main `image` is always first; `images` adds optional extras.
 *
 * This module intentionally imports only the Product type, so client
 * components do not pull the full products.json bundle into their chunk.
 */
export function getProductGallery(product: Product): string[] {
  const sources = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
  const seen = new Set<string>()
  const gallery: string[] = []

  for (const source of sources) {
    if (typeof source !== "string") continue
    const trimmed = source.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    gallery.push(trimmed)
  }

  return gallery
}
