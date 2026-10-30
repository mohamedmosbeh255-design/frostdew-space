"use client"

import { useCallback, useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import {
  filterAndSort,
  type Product,
} from "@/lib/products"
import { AFFILIATE_PROXIMITY_NOTE } from "@/lib/site"
import ProductCard from "./product-card"
import ProductDialog from "./product-dialog"
import ProductFilters from "./products/ProductFilters"

const PAGE_SIZE = 12
const MAX_RELATED = 6

/** Resolves and deduplicates ids, drops unknown references, and caps the row at six. */
function relatedFor(
  product: Product | null,
  productById: Map<string, Product>,
): Product[] {
  if (!product?.relatedProducts?.length) return []

  const seen = new Set<string>()
  const related: Product[] = []
  for (const id of product.relatedProducts) {
    if (seen.has(id)) continue
    seen.add(id)
    const match = productById.get(id)
    if (match) related.push(match)
    if (related.length === MAX_RELATED) break
  }
  return related
}

export default function Shop({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filtered, setFiltered] = useState<Product[]>(products)
  const [filterVersion, setFilterVersion] = useState(0)
  const [selected, setSelected] = useState<Product | null>(null)

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )
  const results = useMemo(
    () => filterAndSort(filtered, "all", query, "featured"),
    [filtered, query],
  )
  const shown = results.slice(0, visibleCount)
  const related = useMemo(
    () => relatedFor(selected, productById),
    [selected, productById],
  )

  const handleFilterChange = useCallback((next: Product[]) => {
    setFiltered(next)
    setVisibleCount(PAGE_SIZE)
  }, [])

  const reset = () => {
    setQuery("")
    setVisibleCount(PAGE_SIZE)
    setFilterVersion((version) => version + 1)
  }

  return (
    <section id="shop" aria-labelledby="shop-title" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-glacier">The Collection</p>
          <h2 id="shop-title" className="font-display text-4xl font-medium text-midnight sm:text-5xl">
            Korean skincare, curated
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {products.length} products from trusted K-beauty brands. Tap any product for details, or go
            straight to the store.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            As an Amazon Associate (Amazon US, Amazon UK) and a Stylevana affiliate partner, FrostDew
            earns a commission from qualifying purchases. Prices may change, so please check the store
            for the current price.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-glacier" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder="Search products or brands"
              aria-label="Search products or brands"
              className="h-11 w-full rounded-full border border-input bg-white pl-10 pr-4 text-sm text-midnight placeholder:text-muted-foreground focus-visible:outline-2"
            />
          </div>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Showing {shown.length} of {results.length} products
          </p>
        </div>

        <div className="mt-4">
          <ProductFilters
            key={filterVersion}
            products={products}
            onFilterChange={handleFilterChange}
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {AFFILIATE_PROXIMITY_NOTE}
        </p>

        {results.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-input bg-white/60 px-6 py-16 text-center">
            <p className="font-display text-xl text-midnight">No products match your filters</p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-winter px-5 py-2.5 text-sm font-bold text-snow hover:bg-midnight"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setSelected} />
            ))}
          </div>
        )}

        {shown.length < results.length && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="rounded-full border border-winter px-8 py-3 text-sm font-bold text-winter transition-colors hover:bg-winter hover:text-snow"
            >
              Show more products
            </button>
          </div>
        )}
      </div>

      <ProductDialog
        product={selected}
        related={related}
        onSelectRelated={setSelected}
        onClose={() => setSelected(null)}
      />
    </section>
  )
}
