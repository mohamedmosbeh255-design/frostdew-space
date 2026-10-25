"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import {
  CATEGORIES,
  PRODUCTS,
  SORT_OPTIONS,
  countByCategory,
  filterAndSort,
  type Product,
  type SortKey,
} from "@/lib/products"
import ProductCard from "./product-card"
import ProductDialog from "./product-dialog"

const PAGE_SIZE = 12

export default function Shop() {
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("featured")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Product | null>(null)

  const counts = useMemo(() => countByCategory(PRODUCTS), [])
  const results = useMemo(() => filterAndSort(PRODUCTS, category, query, sort), [category, query, sort])
  const shown = results.slice(0, visibleCount)

  const reset = () => {
    setCategory("all")
    setQuery("")
    setSort("featured")
    setVisibleCount(PAGE_SIZE)
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
            {PRODUCTS.length} products from trusted K-beauty brands. Tap any product for details, or go
            straight to the store.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            As an Amazon Associate (Amazon US, Amazon UK) and a Stylevana affiliate partner, FrostDew
            earns a commission from qualifying purchases. Prices may change, so please check the store
            for the current price.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Product categories"
            className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
          >
            {CATEGORIES.filter((c) => counts[c.id]).map((c) => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(c.id)
                    setVisibleCount(PAGE_SIZE)
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    active
                      ? "bg-winter text-snow shadow-md shadow-winter/25"
                      : "border border-border bg-white text-winter hover:bg-ice"
                  }`}
                >
                  {c.label} <span className={active ? "text-frost" : "text-glacier"}>{counts[c.id]}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-64">
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort products"
              className="h-11 rounded-full border border-input bg-white px-4 text-sm font-semibold text-midnight"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground" role="status" aria-live="polite">
          Showing {shown.length} of {results.length} products
        </p>

        {results.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-input bg-white/60 px-6 py-16 text-center">
            <p className="font-display text-xl text-midnight">No products match your search</p>
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

      <ProductDialog product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
