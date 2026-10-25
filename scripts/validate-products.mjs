#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  AFFILIATE,
  REMOVED_FIELDS,
  validateProductRecord,
} from "../lib/product-rules.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATA_FILE = path.join(ROOT, "data", "products.json")

const errors = []
const warnings = []

const label = (index, product) =>
  `#${String(index + 1).padStart(2, "0")} ${product?.id ?? "(missing id)"}`

const fail = (index, product, message) => {
  errors.push(`${label(index, product)}: ${message}`)
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

const storeCounts = new Map()
const categoryCounts = new Map()
const optionalCounts = { price: 0, rating: 0, reviewCount: 0, addedDate: 0 }

for (const [index, product] of products.entries()) {
  const result = validateProductRecord(product, { allProducts: products, selfIndex: index })

  for (const message of result.errors) fail(index, product, message)
  for (const message of result.warnings) {
    warnings.push(`${label(index, product)}: ${message}`)
  }

  if (!product || typeof product !== "object" || Array.isArray(product)) continue

  if (typeof product.store === "string") {
    storeCounts.set(product.store, (storeCounts.get(product.store) ?? 0) + 1)
  }
  if (Array.isArray(product.categories)) {
    for (const category of product.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    }
  }

  for (const field of Object.keys(optionalCounts)) {
    if (Object.hasOwn(product, field)) optionalCounts[field] += 1
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
console.log(
  `  Stores: ${[...storeCounts.entries()].map(([store, count]) => `${store} ${count}`).join(", ")}`,
)
console.log(
  `  Categories: ${[...categoryCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => `${category} ${count}`)
    .join(", ")}`,
)
console.log(`  Removed fields absent: ${REMOVED_FIELDS.join(", ")}`)
console.log(
  `  Optional fields: price ${optionalCounts.price}, rating ${optionalCounts.rating}, reviewCount ${optionalCounts.reviewCount}, addedDate ${optionalCounts.addedDate}`,
)
console.log(`  Amazon US tag: ${AFFILIATE.amazonUs}`)
console.log(`  Amazon UK tag: ${AFFILIATE.amazonUk}`)
console.log(`  Stylevana ref: ${AFFILIATE.stylevanaRef}`)

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const warning of warnings) console.log(`  - ${warning}`)
}
