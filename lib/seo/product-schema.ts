import { parsePrice, storeLabel } from "@/lib/format"
import type { Product } from "@/lib/products"

/**
 * Optional review data. The catalog stores only a rating + review count today,
 * so this is not populated by the app, but the schema mapper supports it for
 * when real reviews are added.
 */
export type ProductReview = {
  rating: number
  author: string
  content: string
  /** ISO date, e.g. "2026-10-29". */
  date: string
}

type SchemaProduct = Product & { reviews?: ProductReview[] }

const CURRENCY_CODES: Record<string, string> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "¥": "JPY",
  "₩": "KRW",
  "₹": "INR",
}

function absoluteImageUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`
}

/** Main image first, then gallery images, resolved to absolute URLs. */
export function productImageUrls(product: Product, baseUrl: string): string[] {
  const sources = [product.image, ...(product.images ?? [])].filter(Boolean)
  return [...new Set(sources)].map((url) => absoluteImageUrl(url, baseUrl))
}

/**
 * Builds a schema.org `Product` JSON-LD payload for a product detail page.
 *
 * The return value is a JSON string ready for `dangerouslySetInnerHTML`.
 * `<` is escaped so admin-entered text cannot close the script element.
 */
export function generateProductSchema(product: SchemaProduct, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "")
  const pageUrl = `${base}/products/${product.id}`
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": pageUrl,
    name: product.name,
    description: product.description,
    image: productImageUrls(product, base),
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand },
    url: pageUrl,
  }

  if (product.categories.length > 0) schema.category = product.categories[0]

  // The stored price is a display string such as "$18.90"; the schema needs a
  // number and an ISO 4217 currency code.
  const offerPrice = parsePrice(product.salePrice ?? product.price ?? "")
  const currency = offerPrice ? CURRENCY_CODES[offerPrice.currency] : undefined

  if (offerPrice && currency) {
    schema.offers = {
      "@type": "Offer",
      url: product.url,
      price: offerPrice.amount,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: storeLabel(product.store) },
    }
  }

  const reviewCount = product.reviews?.length ?? product.reviewCount

  if (product.rating !== undefined && reviewCount !== undefined && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount,
      bestRating: 5,
    }
  }

  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
      },
      author: { "@type": "Person", name: review.author },
      reviewBody: review.content,
      datePublished: review.date,
    }))
  }

  return JSON.stringify(schema).replace(/</g, "\\u003c")
}
