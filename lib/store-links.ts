import type { Product } from "@/lib/products"
import type { AmazonStore } from "@/lib/regions"
import { storeLabel } from "@/lib/format"

export const STORE_LINK_ORDER = ["amazonUs", "amazonUk", "stylevana"] as const

export type StoreLinkKey = (typeof STORE_LINK_ORDER)[number]

export const STORE_LINK_META: Record<StoreLinkKey, { label: string; legacyStore: string }> = {
  amazonUs: { label: "Amazon US", legacyStore: "Amazon" },
  amazonUk: { label: "Amazon UK", legacyStore: "Amazon UK" },
  stylevana: { label: "Stylevana", legacyStore: "Stylevana" },
}

/**
 * Affiliate tags are kept in sync with `lib/product-rules.mjs`. The catalog
 * currently stores US URLs, so the UK link is derived from the same ASIN at
 * runtime to keep the primary CTA on the shopper's local storefront.
 */
export const AMAZON_AFFILIATE_TAGS = {
  amazonUs: "beautynest202-20",
  amazonUk: "beautynestkor-21",
} as const

const AMAZON_HOST: Record<"amazonUs" | "amazonUk", string> = {
  amazonUs: "www.amazon.com",
  amazonUk: "www.amazon.co.uk",
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

/**
 * Moves the Amazon store that matches the visitor's country to the front so
 * the primary CTA opens the closest storefront. The relative order of the
 * remaining links is preserved.
 */
export function orderStoreLinksForRegion(
  links: ProductStoreLink[],
  preferred: AmazonStore,
): ProductStoreLink[] {
  const index = links.findIndex((link) => link.key === preferred)
  if (index <= 0) return links

  const ordered = [...links]
  const [first] = ordered.splice(index, 1)
  ordered.unshift(first)
  return ordered
}

/** Pull an ASIN out of a standard Amazon product URL. */
function extractAmazonAsin(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!/(^|\.)amazon\./i.test(parsed.hostname)) return null
    const match = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i.exec(parsed.pathname)
    return match?.[1]?.toUpperCase() ?? null
  } catch {
    return null
  }
}

function amazonProductLink(store: "amazonUs" | "amazonUk", asin: string): ProductStoreLink {
  return {
    key: store,
    label: STORE_LINK_META[store].label,
    url: `https://${AMAZON_HOST[store]}/dp/${asin}?tag=${AMAZON_AFFILIATE_TAGS[store]}`,
  }
}

/**
 * Adds the Amazon store that matches the visitor's country when the catalog
 * only stored the other one, then moves it to the front. ASINs are shared by
 * Amazon marketplaces; if a listing is unavailable locally Amazon shows its own
 * fallback page rather than a dead link.
 */
export function getProductStoreLinksForRegion(
  product: Product,
  preferred: AmazonStore,
): ProductStoreLink[] {
  const links = getProductStoreLinks(product)
  if (links.some((link) => link.key === preferred)) {
    return orderStoreLinksForRegion(links, preferred)
  }

  const fallback: AmazonStore = preferred === "amazonUk" ? "amazonUs" : "amazonUk"
  const source = links.find((link) => link.key === fallback)
  const asin = source ? extractAmazonAsin(source.url) : null
  if (asin && !links.some((link) => link.key === preferred)) {
    links.push(amazonProductLink(preferred, asin))
  }

  return orderStoreLinksForRegion(links, preferred)
}

/**
 * The CTA used on cards, dialogs and routine suggestions: every available
 * store link, with the visitor's preferred Amazon store first. One button
 * per non-empty link — if a product has three links, three buttons render.
 */
export function getPrimaryStoreLinks(
  product: Product,
  preferred: AmazonStore,
): ProductStoreLink[] {
  return getProductStoreLinksForRegion(product, preferred)
}
