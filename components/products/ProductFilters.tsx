"use client"

import { useEffect, useMemo, useState } from "react"
import { RotateCcw, Star } from "lucide-react"
import { parsePrice } from "@/lib/format"
import { CATEGORIES, type Product } from "@/lib/products"
import type { ShopFilters, ShopSort } from "@/lib/shop-params"

/** Effective price: the sale price when present, otherwise the regular price. */
function priceOf(product: Product): number | null {
  const parsed = parsePrice(product.salePrice ?? product.price ?? "")
  return parsed ? parsed.amount : null
}

type ProductFiltersProps = {
  /** The full catalog, so the options do not disappear as results narrow. */
  products: Product[]
  value: ShopFilters
  maxCatalogPrice: number
  onChange: (next: ShopFilters) => void
  onReset: () => void
  isPending?: boolean
}

export default function ProductFilters({
  products,
  value,
  maxCatalogPrice,
  onChange,
  onReset,
  isPending = false,
}: ProductFiltersProps) {
  const categoryOrder = useMemo(
    () => new Map<string, number>(CATEGORIES.map((category, index) => [category.id, index])),
    [],
  )

  const categories = useMemo(() => {
    const ids = [...new Set(products.flatMap((product) => product.categories))]
    return ids.sort(
      (a, b) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99),
    )
  }, [products, categoryOrder])

  const prices = useMemo(
    () => products.map(priceOf).filter((value): value is number => value !== null),
    [products],
  )

  // The slider is a draft while dragging; the server query runs on release so
  // a drag does not fire a request per pixel.
  const [priceDraft, setPriceDraft] = useState(value.maxPrice)
  useEffect(() => {
    setPriceDraft(value.maxPrice)
  }, [value.maxPrice])

  const commitPrice = () => {
    if (priceDraft !== value.maxPrice) {
      onChange({ ...value, maxPrice: priceDraft })
    }
  }

  const active =
    value.category !== "all" ||
    value.maxPrice < maxCatalogPrice ||
    value.rating > 0 ||
    value.sort !== "featured"

  const selectClass =
    "mt-2 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-midnight focus-visible:outline-2"

  return (
    <div
      aria-busy={isPending}
      className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg text-midnight">Filters</h3>
        {active && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-winter transition-colors hover:text-midnight"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="filter-category" className="text-xs font-bold uppercase tracking-[0.14em] text-glacier">
            Category
          </label>
          <select
            id="filter-category"
            value={value.category}
            onChange={(event) =>
              onChange({ ...value, category: event.target.value })
            }
            className={selectClass}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORIES.find((entry) => entry.id === category)?.label ?? category}
              </option>
            ))}
          </select>
        </div>

        {prices.length > 0 && (
          <div>
            <label htmlFor="filter-price" className="text-xs font-bold uppercase tracking-[0.14em] text-glacier">
              Max price: ${priceDraft}
            </label>
            <input
              id="filter-price"
              type="range"
              min="0"
              max={maxCatalogPrice}
              step="1"
              value={priceDraft}
              onChange={(event) => setPriceDraft(Number(event.target.value))}
              onPointerUp={commitPrice}
              onTouchEnd={commitPrice}
              onKeyUp={commitPrice}
              onBlur={commitPrice}
              className="mt-4 w-full accent-[var(--color-winter,#294a67)]"
            />
          </div>
        )}

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-glacier">
            Minimum rating
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Minimum rating">
            <button
              type="button"
              aria-pressed={value.rating === 0}
              onClick={() => onChange({ ...value, rating: 0 })}
              className={`h-8 rounded-lg px-2.5 text-xs font-bold transition-colors ${
                value.rating === 0
                  ? "bg-winter text-snow"
                  : "border border-border bg-white text-winter hover:bg-ice"
              }`}
            >
              Any
            </button>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-label={`${rating} stars and up`}
                aria-pressed={value.rating === rating}
                onClick={() => onChange({ ...value, rating })}
                className={`inline-flex h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                  value.rating === rating
                    ? "bg-amber-cta text-midnight"
                    : "border border-border bg-white text-winter hover:bg-ice"
                }`}
              >
                {rating}
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="filter-sort" className="text-xs font-bold uppercase tracking-[0.14em] text-glacier">
            Sort by
          </label>
          <select
            id="filter-sort"
            value={value.sort}
            onChange={(event) =>
              onChange({ ...value, sort: event.target.value as ShopSort })
            }
            className={selectClass}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>
    </div>
  )
}
