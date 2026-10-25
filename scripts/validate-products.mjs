#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATA_FILE = path.join(ROOT, "data", "products.json")

const ALLOWED_CATEGORIES = new Set([
  "masks",
  "serums",
  "toners",
  "moisturizers",
  "sunscreens",
  "cleansers",
  "lip-care",
  "sets",
])

const ALLOWED_STORES = new Set(["Amazon", "Amazon UK", "Stylevana"])

const AFFILIATE = {
  amazonUs: "beautynest202-20",
  amazonUk: "beautynestkor-21",
  stylevanaRef: "frostdew",
  awinMid: "90791",
  awinAffid: "3117636",
}

const REQUIRED_STRING_FIELDS = [
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

const REMOVED_FIELDS = ["rating", "reviews", "size"]

const errors = []
const warnings = []

const label = (index, product) =>
  `#${String(index + 1).padStart(2, "0")} ${product?.id ?? "(missing id)"}`

const fail = (index, product, message) => {
  errors.push(`${label(index, product)}: ${message}`)
}

const validateUrl = (value) => {
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  return parsed
}

const validateAffiliate = (product, url, index) => {
  const host = url.hostname.toLowerCase()
  const tags = url.searchParams.getAll("tag")
  const refs = url.searchParams.getAll("ref")
  const tag = tags[0] ?? null
  const ref = refs[0] ?? null

  if (tags.length > 1) {
    fail(index, product, "URL contains more than one tag parameter")
  }
  if (refs.length > 1) {
    fail(index, product, "URL contains more than one ref parameter")
  }

  if (product.store === "Amazon") {
    if (host === "amzn.to") {
      if (tag !== null && tag !== AFFILIATE.amazonUs) {
        fail(index, product, `amzn.to short link uses unexpected tag "${tag}"`)
      }
      return
    }

    if (host !== "www.amazon.com" && host !== "amazon.com") {
      fail(index, product, `Amazon product points to unexpected host "${host}"`)
      return
    }
    if (tag !== AFFILIATE.amazonUs) {
      fail(index, product, `Amazon US tag must be "${AFFILIATE.amazonUs}" (found "${tag ?? "none"}")`)
    }
    return
  }

  if (product.store === "Amazon UK") {
    if (host !== "www.amazon.co.uk" && host !== "amazon.co.uk") {
      fail(index, product, `Amazon UK product points to unexpected host "${host}"`)
      return
    }
    if (tag !== AFFILIATE.amazonUk) {
      fail(index, product, `Amazon UK tag must be "${AFFILIATE.amazonUk}" (found "${tag ?? "none"}")`)
    }
    return
  }

  if (product.store === "Stylevana") {
    if (host === "www.stylevana.com" || host === "stylevana.com") {
      if (ref !== AFFILIATE.stylevanaRef) {
        fail(index, product, `Stylevana ref must be "${AFFILIATE.stylevanaRef}" (found "${ref ?? "none"}")`)
      }
      return
    }

    if (host === "www.awin1.com" || host === "awin1.com") {
      if (
        url.searchParams.get("awinmid") !== AFFILIATE.awinMid ||
        url.searchParams.get("awinaffid") !== AFFILIATE.awinAffid
      ) {
        fail(
          index,
          product,
          `Awin link must include awinmid=${AFFILIATE.awinMid} and awinaffid=${AFFILIATE.awinAffid}`,
        )
      }
      return
    }

    fail(index, product, `Stylevana product points to unexpected host "${host}"`)
  }
}

let products
try {
  products = JSON.parse(await readFile(DATA_FILE, "utf8"))
} catch (error) {
  console.error(`Unable to read or parse ${DATA_FILE}:`)
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

if (!Array.isArray(products)) {
  console.error("Product data must be a JSON array.")
  process.exit(1)
}

if (products.length === 0) {
  errors.push("Product data is empty.")
}

const ids = new Map()
const urls = new Map()
const storeCounts = new Map()
const categoryCounts = new Map()

for (const [index, product] of products.entries()) {
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    errors.push(`#${String(index + 1).padStart(2, "0")}: product must be an object`)
    continue
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof product[field] !== "string" || product[field].trim() === "") {
      fail(index, product, `"${field}" must be a non-empty string`)
    }
  }

  for (const field of REMOVED_FIELDS) {
    if (Object.hasOwn(product, field)) {
      fail(index, product, `"${field}" must not be present`)
    }
  }

  if (typeof product.bestseller !== "boolean") {
    fail(index, product, `"bestseller" must be a boolean`)
  }

  if (!Array.isArray(product.categories) || product.categories.length === 0) {
    fail(index, product, `"categories" must be a non-empty array`)
  } else {
    for (const category of product.categories) {
      if (!ALLOWED_CATEGORIES.has(category)) {
        fail(index, product, `unknown category "${category}"`)
      }
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    }
  }

  if (!Array.isArray(product.features)) {
    fail(index, product, `"features" must be an array`)
  } else {
    if (product.features.length === 0) {
      warnings.push(`${label(index, product)}: "features" is empty; the detail dialog will omit the list`)
    }
    for (const feature of product.features) {
      if (typeof feature !== "string" || feature.trim() === "") {
        fail(index, product, `"features" must contain only non-empty strings`)
      }
    }
  }

  if (typeof product.id === "string" && product.id.trim() !== "") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id)) {
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*-?$/.test(product.id)) {
        warnings.push(`${label(index, product)}: "id" ends with a hyphen; consider normalizing it later`)
      } else {
        fail(index, product, `"id" must be a lowercase hyphenated slug`)
      }
    }
    if (ids.has(product.id)) {
      fail(index, product, `duplicate id also used by #${String(ids.get(product.id) + 1).padStart(2, "0")}`)
    } else {
      ids.set(product.id, index)
    }
  }

  if (!ALLOWED_STORES.has(product.store)) {
    fail(index, product, `unapproved store "${product.store}"`)
  } else {
    storeCounts.set(product.store, (storeCounts.get(product.store) ?? 0) + 1)
  }

  if (typeof product.url === "string" && product.url.trim() !== "") {
    const url = validateUrl(product.url)
    if (!url) {
      fail(index, product, `"url" is not a valid URL`)
    } else {
      if (url.protocol !== "https:") {
        fail(index, product, `"url" must use https`)
      }
      if (url.username || url.password) {
        fail(index, product, `"url" must not contain credentials`)
      }
      if (urls.has(url.href)) {
        fail(index, product, `duplicate URL also used by #${String(urls.get(url.href) + 1).padStart(2, "0")}`)
      } else {
        urls.set(url.href, index)
      }
      if (ALLOWED_STORES.has(product.store)) {
        validateAffiliate(product, url, index)
      }
    }
  }

  if (typeof product.image === "string" && product.image.trim() !== "") {
    const image = validateUrl(product.image)
    if (!image) {
      fail(index, product, `"image" is not a valid URL`)
    } else if (image.protocol !== "https:") {
      fail(index, product, `"image" must use https`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Product validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`  - ${error}`)
  if (warnings.length > 0) {
    console.error(`\n${warnings.length} warning(s):`)
    for (const warning of warnings) console.error(`  - ${warning}`)
  }
  process.exit(1)
}

console.log("Product data validation passed.")
console.log(`  Products: ${products.length}`)
console.log(`  Stores: ${[...storeCounts.entries()].map(([store, count]) => `${store} ${count}`).join(", ")}`)
console.log(
  `  Categories: ${[...categoryCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => `${category} ${count}`)
    .join(", ")}`,
)
console.log(`  Removed fields absent: ${REMOVED_FIELDS.join(", ")}`)
console.log(`  Amazon US tag: ${AFFILIATE.amazonUs}`)
console.log(`  Amazon UK tag: ${AFFILIATE.amazonUk}`)
console.log(`  Stylevana ref: ${AFFILIATE.stylevanaRef}`)

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const warning of warnings) console.log(`  - ${warning}`)
}
