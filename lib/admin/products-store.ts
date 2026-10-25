import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Product } from "@/lib/products"

const DATA_FILE = path.join(process.cwd(), "data", "products.json")

export class ProductStoreError extends Error {}

export async function readProducts(): Promise<Product[]> {
  let raw: string
  try {
    raw = await readFile(DATA_FILE, "utf8")
  } catch {
    throw new ProductStoreError("Unable to read data/products.json")
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error("not an array")
    return parsed as Product[]
  } catch {
    throw new ProductStoreError("data/products.json is not a valid JSON array")
  }
}

/**
 * Writes to a temporary file first, then renames, so a failed write can never leave
 * a half-written products.json behind.
 */
export async function writeProducts(products: Product[]): Promise<void> {
  const payload = `${JSON.stringify(products, null, 1)}\n`
  const temporary = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, payload, "utf8")
  await rename(temporary, DATA_FILE)
}

export function productIndexById(products: Product[], id: string): number {
  return products.findIndex((product) => product.id === id)
}
