/**
 * Maps between the app's camelCase `Product` shape and the snake_case
 * `public.products` row. Shared by the runtime store and the seed script.
 */

const AFFILIATE_LINK_KEYS = ["amazonUs", "amazonUk", "stylevana"]

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
    sale_price: product.salePrice ?? null,
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
    product.salePrice = row.sale_price
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
