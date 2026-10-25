/**
 * Shared product validation rules.
 *
 * Plain ESM with JSDoc types so both the Node CLI (`scripts/validate-products.mjs`)
 * and the admin API route can import the exact same logic without a build step.
 */

export const ALLOWED_CATEGORIES = new Set([
  "masks",
  "serums",
  "toners",
  "moisturizers",
  "sunscreens",
  "cleansers",
  "lip-care",
  "sets",
])

export const ALLOWED_STORES = new Set(["Amazon", "Amazon UK", "Stylevana"])

/** Store-specific slots supported inside `affiliateLinks`. */
export const AFFILIATE_LINK_KEYS = ["amazonUs", "amazonUk", "stylevana"]

/** Maps each `affiliateLinks` slot to the legacy `store` value it represents. */
export const AFFILIATE_LINK_STORE = {
  amazonUs: "Amazon",
  amazonUk: "Amazon UK",
  stylevana: "Stylevana",
}

export const AFFILIATE = {
  amazonUs: "beautynest202-20",
  amazonUk: "beautynestkor-21",
  stylevanaRef: "frostdew",
  awinMid: "90791",
  awinAffid: "3117636",
}

export const REQUIRED_STRING_FIELDS = [
  "id",
  "brand",
  "name",
  "fullName",
  "short",
  "description",
  "image",
  "url",
  "store",
]

/**
 * Fields removed for Amazon compliance in Step 2. Both remain forbidden;
 * `rating` and `reviewCount` are now supported optional fields instead.
 */
export const REMOVED_FIELDS = ["reviews", "size"]

export const PRICE_PATTERN = /^[$£€¥₩₹]\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$/
export const ADDED_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ID_TRAILING_HYPHEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-?$/

/** @param {unknown} value */
const parseUrl = (value) => {
  try {
    return new URL(/** @type {string} */ (value))
  } catch {
    return null
  }
}

/**
 * @param {{ store: string }} product
 * @param {URL} url
 * @returns {string[]}
 */
export function validateAffiliate(product, url) {
  /** @type {string[]} */
  const errors = []
  const host = url.hostname.toLowerCase()
  const tags = url.searchParams.getAll("tag")
  const refs = url.searchParams.getAll("ref")
  const tag = tags[0] ?? null
  const ref = refs[0] ?? null

  if (tags.length > 1) errors.push("URL contains more than one tag parameter")
  if (refs.length > 1) errors.push("URL contains more than one ref parameter")

  if (product.store === "Amazon") {
    if (host === "amzn.to") {
      if (tag !== null && tag !== AFFILIATE.amazonUs) {
        errors.push(`amzn.to short link uses unexpected tag "${tag}"`)
      }
      return errors
    }

    if (host !== "www.amazon.com" && host !== "amazon.com") {
      errors.push(`Amazon product points to unexpected host "${host}"`)
      return errors
    }
    if (tag !== AFFILIATE.amazonUs) {
      errors.push(`Amazon US tag must be "${AFFILIATE.amazonUs}" (found "${tag ?? "none"}")`)
    }
    return errors
  }

  if (product.store === "Amazon UK") {
    if (host !== "www.amazon.co.uk" && host !== "amazon.co.uk") {
      errors.push(`Amazon UK product points to unexpected host "${host}"`)
      return errors
    }
    if (tag !== AFFILIATE.amazonUk) {
      errors.push(`Amazon UK tag must be "${AFFILIATE.amazonUk}" (found "${tag ?? "none"}")`)
    }
    return errors
  }

  if (product.store === "Stylevana") {
    if (host === "www.stylevana.com" || host === "stylevana.com") {
      if (ref !== AFFILIATE.stylevanaRef) {
        errors.push(`Stylevana ref must be "${AFFILIATE.stylevanaRef}" (found "${ref ?? "none"}")`)
      }
      return errors
    }

    if (host === "www.awin1.com" || host === "awin1.com") {
      if (
        url.searchParams.get("awinmid") !== AFFILIATE.awinMid ||
        url.searchParams.get("awinaffid") !== AFFILIATE.awinAffid
      ) {
        errors.push(
          `Awin link must include awinmid=${AFFILIATE.awinMid} and awinaffid=${AFFILIATE.awinAffid}`,
        )
      }
      return errors
    }

    errors.push(`Stylevana product points to unexpected host "${host}"`)
  }

  return errors
}

/** @param {unknown} value */
const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

/**
 * Every affiliate URL a product carries, legacy `url` first and then
 * `affiliateLinks` slots in their fixed order.
 *
 * @param {any} product
 * @returns {{ field: string, store: string, url: string }[]}
 */
export function productLinkEntries(product) {
  if (!isPlainObject(product)) return []

  /** @type {{ field: string, store: string, url: string }[]} */
  const entries = []

  if (typeof product.url === "string" && product.url.trim() !== "") {
    entries.push({ field: "url", store: product.store, url: product.url.trim() })
  }

  if (isPlainObject(product.affiliateLinks)) {
    for (const key of AFFILIATE_LINK_KEYS) {
      const value = product.affiliateLinks[key]
      if (typeof value === "string" && value.trim() !== "") {
        entries.push({
          field: `affiliateLinks.${key}`,
          store: AFFILIATE_LINK_STORE[key],
          url: value.trim(),
        })
      }
    }
  }

  return entries
}

/**
 * @param {any} product
 * @param {string} href
 * @returns {string | null} The field path that already uses this exact URL.
 */
const matchingLinkField = (product, href) => {
  for (const entry of productLinkEntries(product)) {
    const parsed = parseUrl(entry.url)
    if (parsed !== null && parsed.href === href) return entry.field
  }
  return null
}

/**
 * Validate one product record.
 *
 * @param {unknown} product
 * @param {{ allProducts?: any[], selfIndex?: number }} [context]
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateProductRecord(product, { allProducts = [], selfIndex = -1 } = {}) {
  /** @type {string[]} */
  const errors = []
  /** @type {string[]} */
  const warnings = []
  /** @param {string} message */
  const fail = (message) => errors.push(message)
  /** @param {string} message */
  const warn = (message) => warnings.push(message)

  if (!product || typeof product !== "object" || Array.isArray(product)) {
    return { errors: ["product must be an object"], warnings }
  }

  const record = /** @type {Record<string, any>} */ (product)

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof record[field] !== "string" || record[field].trim() === "") {
      fail(`"${field}" must be a non-empty string`)
    }
  }

  for (const field of REMOVED_FIELDS) {
    if (Object.hasOwn(record, field)) fail(`"${field}" must not be present`)
  }

  if (typeof record.bestseller !== "boolean") {
    fail(`"bestseller" must be a boolean`)
  }

  if (Object.hasOwn(record, "price")) {
    if (typeof record.price !== "string" || record.price.trim() === "") {
      fail(`"price" must be a non-empty string when present`)
    } else if (!PRICE_PATTERN.test(record.price.trim())) {
      fail(`"price" must be a currency symbol plus an amount (for example "$24.99" or "£19.99")`)
    }
  }

  if (Object.hasOwn(record, "rating")) {
    if (typeof record.rating !== "number" || !Number.isFinite(record.rating)) {
      fail(`"rating" must be a number when present`)
    } else if (record.rating < 1 || record.rating > 5) {
      fail(`"rating" must be between 1 and 5 (found ${record.rating})`)
    } else if (!/^\d(?:\.\d{1,2})?$/.test(String(record.rating))) {
      fail(`"rating" must have at most two decimal places`)
    }
  }

  if (Object.hasOwn(record, "reviewCount")) {
    if (typeof record.reviewCount !== "number" || !Number.isInteger(record.reviewCount)) {
      fail(`"reviewCount" must be an integer when present`)
    } else if (record.reviewCount < 0) {
      fail(`"reviewCount" must be 0 or greater (found ${record.reviewCount})`)
    }
  }

  if (Object.hasOwn(record, "addedDate")) {
    const value = typeof record.addedDate === "string" ? record.addedDate.trim() : null
    if (!value || !ADDED_DATE_PATTERN.test(value)) {
      fail(`"addedDate" must be a YYYY-MM-DD date when present`)
    } else {
      const date = new Date(`${value}T00:00:00Z`)
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        fail(`"addedDate" is not a real calendar date (found "${value}")`)
      }
    }
  }

  if (Object.hasOwn(record, "relatedProducts")) {
    if (!Array.isArray(record.relatedProducts)) {
      fail(`"relatedProducts" must be an array of product ids when present`)
    } else {
      /** @type {Set<string>} */
      const seenRelated = new Set()
      for (const related of record.relatedProducts) {
        if (typeof related !== "string" || related.trim() === "") {
          fail(`"relatedProducts" must contain only non-empty strings`)
          continue
        }
        if (seenRelated.has(related)) {
          fail(`duplicate related product id "${related}"`)
        }
        seenRelated.add(related)

        if (typeof record.id === "string" && related === record.id) {
          fail(`"relatedProducts" must not reference the product itself`)
          continue
        }
        const exists = allProducts.some(
          (candidate) => candidate && typeof candidate.id === "string" && candidate.id === related,
        )
        if (!exists) fail(`related product "${related}" does not exist`)
      }
    }
  }

  if (!Array.isArray(record.categories) || record.categories.length === 0) {
    fail(`"categories" must be a non-empty array`)
  } else {
    for (const category of record.categories) {
      if (!ALLOWED_CATEGORIES.has(category)) fail(`unknown category "${category}"`)
    }
  }

  if (!Array.isArray(record.features)) {
    fail(`"features" must be an array`)
  } else {
    if (record.features.length === 0) {
      warn(`"features" is empty; the detail dialog will omit the list`)
    }
    for (const feature of record.features) {
      if (typeof feature !== "string" || feature.trim() === "") {
        fail(`"features" must contain only non-empty strings`)
      }
    }
  }

  if (typeof record.id === "string" && record.id.trim() !== "") {
    if (!ID_PATTERN.test(record.id)) {
      if (ID_TRAILING_HYPHEN_PATTERN.test(record.id)) {
        warn(`"id" ends with a hyphen; consider normalizing it later`)
      } else {
        fail(`"id" must be a lowercase hyphenated slug`)
      }
    }
    const duplicateIndex = allProducts.findIndex(
      (candidate, index) => index !== selfIndex && candidate && candidate.id === record.id,
    )
    if (duplicateIndex !== -1) {
      fail(`duplicate id also used by #${String(duplicateIndex + 1).padStart(2, "0")}`)
    }
  }

  if (!ALLOWED_STORES.has(record.store)) {
    fail(`unapproved store "${record.store}"`)
  }

  if (typeof record.url === "string" && record.url.trim() !== "") {
    const url = parseUrl(record.url)
    if (!url) {
      fail(`"url" is not a valid URL`)
    } else {
      if (url.protocol !== "https:") fail(`"url" must use https`)
      if (url.username || url.password) fail(`"url" must not contain credentials`)

      const duplicateIndex = allProducts.findIndex(
        (candidate, index) =>
          index !== selfIndex && candidate && matchingLinkField(candidate, url.href) !== null,
      )
      if (duplicateIndex !== -1) {
        fail(`duplicate URL also used by #${String(duplicateIndex + 1).padStart(2, "0")}`)
      }

      if (ALLOWED_STORES.has(record.store)) {
        for (const message of validateAffiliate(record, url)) fail(message)
      }
    }
  }

  if (Object.hasOwn(record, "affiliateLinks")) {
    if (!isPlainObject(record.affiliateLinks)) {
      fail(`"affiliateLinks" must be an object when present`)
    } else {
      for (const key of Object.keys(record.affiliateLinks)) {
        if (!AFFILIATE_LINK_KEYS.includes(key)) {
          fail(`"affiliateLinks" contains unknown store "${key}"`)
        }
      }

      // Within one product, the legacy URL and every slot must be unique.
      /** @type {Map<string, string>} */
      const seenUrls = new Map()
      if (typeof record.url === "string" && record.url.trim() !== "") {
        const legacyUrl = parseUrl(record.url.trim())
        if (legacyUrl !== null) seenUrls.set(legacyUrl.href, "url")
      }

      for (const key of AFFILIATE_LINK_KEYS) {
        if (!Object.hasOwn(record.affiliateLinks, key)) continue

        const field = `affiliateLinks.${key}`
        const value = record.affiliateLinks[key]

        if (typeof value !== "string" || value.trim() === "") {
          fail(`"${field}" must be a non-empty string when present`)
          continue
        }

        const url = parseUrl(value.trim())
        if (!url) {
          fail(`"${field}" is not a valid URL`)
          continue
        }
        if (url.protocol !== "https:") fail(`"${field}" must use https`)
        if (url.username || url.password) fail(`"${field}" must not contain credentials`)

        const reused = seenUrls.get(url.href)
        if (reused !== undefined) {
          fail(`duplicate URL in "${field}" and "${reused}"`)
        } else {
          seenUrls.set(url.href, field)
        }

        const duplicateIndex = allProducts.findIndex(
          (candidate, index) =>
            index !== selfIndex && candidate && matchingLinkField(candidate, url.href) !== null,
        )
        if (duplicateIndex !== -1) {
          fail(
            `"${field}": duplicate URL also used by #${String(duplicateIndex + 1).padStart(2, "0")}`,
          )
        }

        for (const message of validateAffiliate(
          { store: AFFILIATE_LINK_STORE[key] },
          url,
        )) {
          fail(`"${field}": ${message}`)
        }
      }
    }
  }

  if (typeof record.image === "string" && record.image.trim() !== "") {
    const image = parseUrl(record.image)
    if (!image) {
      fail(`"image" is not a valid URL`)
    } else if (image.protocol !== "https:") {
      fail(`"image" must use https`)
    }
  }

  return { errors, warnings }
}
