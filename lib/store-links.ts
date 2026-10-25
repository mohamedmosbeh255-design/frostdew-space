import type { Product } from "@/lib/products"
import { storeLabel } from "@/lib/format"

export const STORE_LINK_ORDER = ["amazonUs", "amazonUk", "stylevana"] as const

export type StoreLinkKey = (typeof STORE_LINK_ORDER)[number]

export const STORE_LINK_META: Record<StoreLinkKey, { label: string; legacyStore: string }> = {
  amazonUs: { label: "Amazon US", legacyStore: "Amazon" },
  amazonUk: { label: "Amazon UK", legacyStore: "Amazon UK" },
  stylevana: { label: "Stylevana", legacyStore: "Stylevana" },
}

export type ProductStoreLink = {
  key: StoreLinkKey | "legacy"
  label: string
  url: string
}

const normalizeUrl = (url: string): string => {
  try {
    return new URL(url).href
  } catch {
    return url
  }
}

const legacyKeyForStore = (store: string): StoreLinkKey | undefined =>
  (Object.keys(STORE_LINK_META) as StoreLinkKey[]).find(
    (key) => STORE_LINK_META[key].legacyStore === store,
  )

/**
 * Merges legacy `url`/`store` with `affiliateLinks` into one deduplicated list in
 * fixed order: Amazon US → Amazon UK → Stylevana → any unknown legacy store.
 *
 * For a store that exists in both places, `affiliateLinks` wins. Duplicate stores
 * and duplicate URLs are never rendered twice.
 */
export function getProductStoreLinks(product: Product): ProductStoreLink[] {
  const links: ProductStoreLink[] = []
  const seenUrls = new Set<string>()
  const seenStoreKeys = new Set<string>()

  const legacyUrl = typeof product.url === "string" ? product.url.trim() : ""
  const legacyKey = legacyKeyForStore(product.store)

  for (const key of STORE_LINK_ORDER) {
    const explicit = product.affiliateLinks?.[key]?.trim()
    const url = explicit || (legacyKey === key ? legacyUrl : "")
    if (!url) continue

    const normalized = normalizeUrl(url)
    if (seenUrls.has(normalized) || seenStoreKeys.has(key)) continue

    seenUrls.add(normalized)
    seenStoreKeys.add(key)
    links.push({ key, label: STORE_LINK_META[key].label, url })
  }

  if (legacyUrl && !legacyKey) {
    const normalized = normalizeUrl(legacyUrl)
    if (!seenUrls.has(normalized)) {
      links.push({ key: "legacy", label: storeLabel(product.store), url: legacyUrl })
    }
  }

  return links
}
