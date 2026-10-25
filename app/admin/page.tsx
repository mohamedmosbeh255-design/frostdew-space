import Link from "next/link"
import ProductTable from "@/components/admin/product-table"
import { isAdminAuthenticated } from "@/lib/admin/auth"
import { readProducts } from "@/lib/admin/products-store"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  // Defence in depth: never read or serialise products for an unauthenticated request.
  if (!(await isAdminAuthenticated())) return null

  const products = await readProducts()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-midnight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} records in data/products.json
          </p>
        </div>
        <Link
          href="/admin/add"
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-4 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252]"
        >
          Add new product
        </Link>
      </div>

      <ProductTable products={products} />
    </div>
  )
}
