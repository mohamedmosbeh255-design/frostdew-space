import { getSupabaseAdminClient, getSupabasePublicClient } from "@/lib/supabase"
import { productToRow, rowToProduct } from "@/lib/product-row.mjs"
import type { Product } from "@/lib/products"

export class ProductStoreError extends Error {}

/** A unique-constraint conflict from a race the pre-check missed. */
export class ProductConflictError extends ProductStoreError {
  field: "id" | "name"

  constructor(field: "id" | "name", message: string) {
    super(message)
    this.name = "ProductConflictError"
    this.field = field
  }
}

function storeError(message: string, error: unknown): ProductStoreError {
  console.error(`[products] ${message}`, error)
  return new ProductStoreError(message)
}

function conflictFrom(error: unknown): ProductConflictError | null {
  if (!error || typeof error !== "object") return null
  const record = error as { code?: string; message?: string }
  if (record.code !== "23505" && !record.message?.includes("duplicate key value")) {
    return null
  }

  const message = record.message ?? ""
  if (message.includes("products_brand_name_unique")) {
    return new ProductConflictError("name", "A product with this name already exists.")
  }
  if (message.includes("products_pkey")) {
    return new ProductConflictError("id", "A product with this ID already exists.")
  }
  return null
}

/** Public catalog read. RLS limits this client to SELECT. */
export async function readProducts(): Promise<Product[]> {
  let supabase
  try {
    supabase = getSupabasePublicClient()
  } catch (error) {
    throw storeError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      error,
    )
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })

  if (error) throw storeError("Unable to read products from Supabase.", error)
  return (data ?? []).map(rowToProduct)
}

/** Inserts a product at the end of the catalog order. Admin only. */
export async function createProduct(input: Product): Promise<Product> {
  const admin = getSupabaseAdminClient()

  // Every new product is stamped with today's date unless the caller supplied
  // one. UTC keeps the value stable regardless of the function's region.
  const product: Product = {
    ...input,
    addedDate: input.addedDate ?? new Date().toISOString().slice(0, 10),
  }

  const { data: last, error: orderError } = await admin
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) throw storeError("Unable to determine the product order.", orderError)

  const sortOrder = (last?.sort_order ?? -1) + 1
  const { error } = await admin.from("products").insert(productToRow(product, sortOrder))

  if (error) {
    const conflict = conflictFrom(error)
    if (conflict) throw conflict
    throw storeError("Unable to save the product.", error)
  }

  // Returned so the API echoes the stored shape, including the defaulted date.
  return product
}

/** Updates an existing product without changing its catalog position. Admin only. */
export async function updateProduct(product: Product): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from("products")
    .update(productToRow(product))
    .eq("id", product.id)

  if (error) {
    const conflict = conflictFrom(error)
    if (conflict) throw conflict
    throw storeError("Unable to save the product.", error)
  }
}

/** Deletes one product. Admin only. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabaseAdminClient().from("products").delete().eq("id", id)
  if (error) throw storeError("Unable to delete the product.", error)
}

export function productIndexById(products: Product[], id: string): number {
  return products.findIndex((product) => product.id === id)
}
