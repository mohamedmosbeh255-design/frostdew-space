/**
 * Maps between the app's camelCase `Product` shape and the snake_case
 * `public.products` row. Shared by the runtime store and the seed script.
 */

const AFFILIATE_LINK_KEYS = ["amazonUs", "amazonUk", "stylevana"]

const PRICE_SYMBOL_PATTERN = /^([$£€¥₩₹])/

/**
 * Converts a display price into the numeric value the `sale_price` column
 * stores. Returns null for a blank value so an empty field clears the column.
 * @param {unknown} value
 * @returns {number | null}
 */
function sanitizePrice(value) {
  if (value === null || value === undefined || value === "") return null

  // Strip currency symbols, commas, spaces
  const cleaned = String(value).replace(/[$£€¥₹₩,\s]/g, "")

  const parsed = parseFloat(cleaned)

  // Validate
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid price: ${value}`)
  }

  // Round to 2 decimal places for numeric column
  return Math.round(parsed * 100) / 100
}

/** Raised when a sale price cannot be converted to the numeric column. */
export class InvalidSalePriceError extends Error {
  /** @param {unknown} value */
  constructor(value) {
    super(`Invalid sale price: ${value}`)
    this.name = "InvalidSalePriceError"
    this.field = "salePrice"
  }
}

/** @param {unknown} value */
function sanitizeSalePrice(value) {
  try {
    return sanitizePrice(value)
  } catch {
    throw new InvalidSalePriceError(value)
  }
}

/**
 * Turns a stored numeric `sale_price` back into the display string the rest of
 * the app expects ("$15.40", "₩19,900"), using the currency of the regular
 * price. Thousands are grouped so the result still matches the validator's
 * price pattern for amounts of 1000 and above.
 * @param {unknown} value
 * @param {unknown} price
 */
function salePriceFromRow(value, price) {
  // A text column (other environments) already stores the formatted string.
  if (typeof value === "string") return value
  if (typeof value !== "number" || !Number.isFinite(value)) return null

  const match = typeof price === "string" ? PRICE_SYMBOL_PATTERN.exec(price.trim()) : null
  const symbol = match ? match[1] : "$"
  // KRW has no minor unit, so won prices are shown without decimals.
  const decimals = symbol === "₩" ? 0 : 2

  // Group in threes without relying on locale data.
  const [whole, fraction] = value.toFixed(decimals).split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${symbol}${grouped}${fraction ? `.${fraction}` : ""}`
}

/**
 * @param {any} product
 * @param {number} [sortOrder] Only set when inserting; updates preserve the
 * existing catalog position.
 */
export function productToRow(product, sortOrder) {
  const row = {
    id: product.id,
    brand: product.brand,
    name: product.name,
    full_name: product.fullName,
    categories: Array.isArray(product.categories) ? product.categories : [],
    short: product.short,
    description: product.description,
    features: Array.isArray(product.features) ? product.features : [],
    image: product.image,
    images: Array.isArray(product.images) ? product.images : [],
    url: product.url,
    store: product.store,
    bestseller: Boolean(product.bestseller),
    price: product.price ?? null,
    sale_price: sanitizeSalePrice(product.salePrice),
    rating: product.rating ?? null,
    review_count: product.reviewCount ?? null,
    added_date: product.addedDate ?? null,
    affiliate_links: product.affiliateLinks ?? {},
    related_products: Array.isArray(product.relatedProducts) ? product.relatedProducts : [],
  }

  if (typeof sortOrder === "number" && Number.isFinite(sortOrder)) {
    row.sort_order = sortOrder
  }

  return row
}

/** @param {any} row */
export function rowToProduct(row) {
  /** @type {any} */
  const product = {
    id: row.id,
    brand: row.brand,
    name: row.name,
    fullName: row.full_name,
    categories: Array.isArray(row.categories) ? row.categories : [],
    short: row.short,
    description: row.description,
    features: Array.isArray(row.features) ? row.features : [],
    image: row.image,
    url: row.url,
    store: row.store,
    bestseller: Boolean(row.bestseller),
  }

  if (Array.isArray(row.images) && row.images.length > 0) product.images = row.images
  if (row.price !== null && row.price !== undefined) product.price = row.price
  if (row.sale_price !== null && row.sale_price !== undefined) {
    const salePrice = salePriceFromRow(row.sale_price, row.price)
    if (salePrice !== null) product.salePrice = salePrice
  }
  if (row.rating !== null && row.rating !== undefined) product.rating = Number(row.rating)
  if (row.review_count !== null && row.review_count !== undefined) {
    product.reviewCount = row.review_count
  }
  if (row.added_date !== null && row.added_date !== undefined) {
    product.addedDate = row.added_date
  }

  if (row.affiliate_links && typeof row.affiliate_links === "object") {
    /** @type {Record<string, string>} */
    const links = {}
    for (const key of AFFILIATE_LINK_KEYS) {
      const value = row.affiliate_links[key]
      if (typeof value === "string" && value.trim()) links[key] = value
    }
    if (Object.keys(links).length > 0) product.affiliateLinks = links
  }

  if (Array.isArray(row.related_products) && row.related_products.length > 0) {
    product.relatedProducts = row.related_products
  }

  return product
}
