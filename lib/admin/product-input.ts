import type { Product } from "@/lib/products"
import { AFFILIATE_LINK_KEYS, REQUIRED_STRING_FIELDS } from "@/lib/product-rules.mjs"

export class InvalidInputError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const OPTIONAL_FIELDS = ["price", "salePrice", "rating", "reviewCount", "addedDate"] as const

/**
 * Whitelists incoming form fields so arbitrary JSON can never add unexpected keys
 * to products.json. Type checks are left to the shared validator.
 */
export function normalizeProductInput(body: unknown): Product {
  if (!isRecord(body)) throw new InvalidInputError("Request body must be a JSON object.")

  const out: Record<string, unknown> = {}

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = body[field]
    out[field] = typeof value === "string" ? value.trim() : value
  }

  out.categories = Array.isArray(body.categories)
    ? body.categories
        .filter((category): category is string => typeof category === "string")
        .map((category) => category.trim())
        .filter(Boolean)
    : body.categories

  out.features = Array.isArray(body.features)
    ? body.features
        .filter((feature): feature is string => typeof feature === "string")
        .map((feature) => feature.trim())
        .filter(Boolean)
    : body.features

  out.bestseller = body.bestseller

  for (const field of OPTIONAL_FIELDS) {
    if (!Object.hasOwn(body, field)) continue
    const value = body[field]
    out[field] = typeof value === "string" ? value.trim() : value
  }

  if (Object.hasOwn(body, "affiliateLinks")) {
    const value = body.affiliateLinks
    if (!isRecord(value)) {
      throw new InvalidInputError("affiliateLinks must be an object.")
    }

    const unknown = Object.keys(value).filter(
      (key) => !(AFFILIATE_LINK_KEYS as string[]).includes(key),
    )
    if (unknown.length > 0) {
      throw new InvalidInputError(`Unknown affiliate store(s): ${unknown.join(", ")}`)
    }

    /** @type {Record<string, unknown>} */
    const links: Record<string, unknown> = {}
    for (const key of AFFILIATE_LINK_KEYS) {
      if (!Object.hasOwn(value, key)) continue
      const link = value[key]
      links[key] = typeof link === "string" ? link.trim() : link
    }

    if (Object.keys(links).length > 0) out.affiliateLinks = links
  }

  if (Object.hasOwn(body, "relatedProducts")) {
    const value = body.relatedProducts
    if (!Array.isArray(value)) {
      throw new InvalidInputError("relatedProducts must be an array of product ids.")
    }
    const ids = value.map((id) => (typeof id === "string" ? id.trim() : id))
    if (ids.length > 0) out.relatedProducts = ids
  }

  return out as unknown as Product
}
