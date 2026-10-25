import type { Product } from "@/lib/products"
import { REQUIRED_STRING_FIELDS } from "@/lib/product-rules.mjs"

export class InvalidInputError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const OPTIONAL_FIELDS = ["price", "rating", "reviewCount", "addedDate"] as const

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

  return out as unknown as Product
}
