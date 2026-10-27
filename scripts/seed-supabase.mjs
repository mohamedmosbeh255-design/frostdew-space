#!/usr/bin/env node

/**
 * Seeds Supabase from the current JSON files.
 *
 * Usage:
 *   corepack pnpm seed:supabase
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (the package script loads .env.local). The migration in
 * supabase/migrations/20261027_integration.sql must already be applied.
 */

import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { findDuplicateProduct, validateProductRecord } from "../lib/product-rules.mjs"
import { productToRow } from "../lib/product-row.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRODUCTS_FILE = path.join(ROOT, "data", "products.json")
const SETTINGS_FILE = path.join(ROOT, "data", "settings.json")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const secretKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
)?.trim()

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local.",
  )
  process.exit(1)
}

let products
let settings
try {
  products = JSON.parse(await readFile(PRODUCTS_FILE, "utf8"))
  settings = JSON.parse(await readFile(SETTINGS_FILE, "utf8"))
} catch (error) {
  console.error("Unable to read data/products.json or data/settings.json:")
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

if (!Array.isArray(products)) {
  console.error("data/products.json must be a JSON array.")
  process.exit(1)
}
if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
  console.error("data/settings.json must be a JSON object.")
  process.exit(1)
}

// Fail before touching the database if the source data would violate the same
// rules the admin API enforces.
const validationErrors = []
for (const [index, product] of products.entries()) {
  const { errors } = validateProductRecord(product, {
    allProducts: products,
    selfIndex: index,
  })
  for (const message of errors) {
    validationErrors.push(`#${String(index + 1).padStart(2, "0")} ${product?.id ?? "(missing id)"}: ${message}`)
  }

  const duplicateIndex = findDuplicateProduct(
    products,
    product?.brand,
    product?.name,
    index,
  )
  if (duplicateIndex !== -1) {
    validationErrors.push(
      `#${String(index + 1).padStart(2, "0")} ${product?.id}: duplicate brand + name with ${products[duplicateIndex]?.id}`,
    )
  }
}

if (validationErrors.length > 0) {
  console.error(`Refusing to seed: ${validationErrors.length} validation error(s).`)
  for (const message of validationErrors.slice(0, 20)) console.error(`- ${message}`)
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

console.log(`Seeding ${url} with ${products.length} products...`)
const productRows = products.map((product, index) => productToRow(product, index))
const { error: productError } = await supabase
  .from("products")
  .upsert(productRows, { onConflict: "id" })

if (productError) {
  const message = productError.message ?? String(productError)
  if (/fetch failed|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) {
    console.error(`Cannot reach ${url}.`)
    console.error(
      "Check that NEXT_PUBLIC_SUPABASE_URL is the exact Project URL from Supabase → Connect and that the project is active.",
    )
    console.error("Until then, use supabase/seed.sql in the SQL Editor instead.")
  } else {
    console.error("Product seed failed:", message)
  }
  if (message.includes("sort_order")) {
    console.error("Run supabase/migrations/20261027_integration.sql first.")
  }
  process.exit(1)
}

const partners = Array.isArray(settings.partners) ? settings.partners : []
console.log(`Seeding site settings and ${partners.length} partner(s)...`)
const { error: settingsError } = await supabase.rpc("save_site_settings", {
  p_social_links: settings.socialLinks ?? {},
  p_content: settings.content ?? {},
  p_partners: partners
    .filter((partner) => partner && typeof partner.name === "string" && typeof partner.url === "string")
    .map((partner, index) => ({
      name: partner.name,
      url: partner.url,
      new_tab: partner.newTab === true,
      position: index,
    })),
})

if (settingsError) {
  console.error("Settings seed failed:", settingsError.message)
  if (settingsError.message.includes("save_site_settings")) {
    console.error("Run supabase/migrations/20261027_integration.sql first.")
  }
  process.exit(1)
}

const [{ count: productCount, error: productCountError }, { count: partnerCount, error: partnerCountError }] =
  await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("partners").select("*", { count: "exact", head: true }),
  ])

if (productCountError || partnerCountError) {
  console.error("Seed completed but verification failed:", productCountError?.message ?? partnerCountError?.message)
  process.exit(1)
}

const { data: settingsRow, error: settingsReadError } = await supabase
  .from("site_settings")
  .select("id")
  .eq("id", "default")
  .maybeSingle()

if (settingsReadError || !settingsRow) {
  console.error("Seed completed but the site_settings row is missing:", settingsReadError?.message ?? "not found")
  process.exit(1)
}

console.log("Seed complete:")
console.log(`- products: ${productCount}`)
console.log(`- partners: ${partnerCount}`)
console.log("- site_settings: default")
if (productCount !== products.length) {
  console.warn(
    `Warning: database has ${productCount} products but the JSON source has ${products.length}. Extra rows were left untouched.`,
  )
}
