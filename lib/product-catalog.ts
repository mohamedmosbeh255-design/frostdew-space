import "server-only"

import { cache } from "react"
import { readProducts } from "@/lib/admin/products-store"
import type { Product } from "@/lib/products"

/**
 * Per-request catalog cache so `generateMetadata()` and the page body share a
 * single Supabase read instead of querying twice.
 */
export const readCatalog = cache(async (): Promise<Product[]> => readProducts())
