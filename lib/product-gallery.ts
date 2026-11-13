import type { Product } from "@/lib/products"

const OPTIMIZED_IMAGE_HOSTS = new Set([
  "m.media-amazon.com",
  "wlbsswmkoahjzentukns.supabase.co",
  "cdn-image.oliveyoung.com",
  "sv9-cdn.stylevana.com",
])

function activeSupabaseHost(): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!configured) return ""
  try {
    return new URL(configured).hostname
  } catch {
    return ""
  }
}

/**
 * `next/image` throws for hosts missing from `images.remotePatterns`. Known
 * catalog hosts stay optimized; local paths and unknown/pasted hosts are
 * rendered directly so an extra image cannot disappear because of a config gap.
 */
export function canOptimizeImage(source: string): boolean {
  if (!source || (source.startsWith("/") && !source.startsWith("//"))) return false

  try {
    const url = new URL(source)
    if (url.protocol !== "https:") return false
    return (
      OPTIMIZED_IMAGE_HOSTS.has(url.hostname) ||
      url.hostname === activeSupabaseHost()
    )
  } catch {
    return false
  }
}

/**
 * Returns the ordered, de-duplicated gallery for a product.
 * The main `image` is always first; `images` adds optional extras.
 *
 * This module intentionally imports only the Product type, so client
 * components do not pull the full catalog into their chunk.
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
