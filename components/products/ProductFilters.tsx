"use client"

import { useEffect, useMemo, useState } from "react"
import { RotateCcw, Star } from "lucide-react"
import { parsePrice } from "@/lib/format"
import { CATEGORIES, type Product } from "@/lib/products"

/**
 * The catalog has no skin-concern or stock columns yet. These optional fields
 * let the component light up automatically if they are added to Product later.
 */
type FilterableProduct = Product & {
  skinConcerns?: string[]
  inStock?: boolean
}

type SortBy = "featured" | "price-low" | "price-high" | "rating" | "newest"

type Filters = {
  category: string
  priceRange: [number, number]
  rating: number
  skinConcern: string[]
  inStock: boolean
  sortBy: SortBy
}

type ProductFiltersProps = {
  products: Product[]
  onFilterChange: (filtered: Product[]) => void
  /** Called after the panel resets, so the shop can clear the search box too. */
  onReset?: () => void
}

/** Effective price: the sale price when present, otherwise the regular price. */
function priceOf(product: Product): number | null {
  const parsed = parsePrice(product.salePrice ?? product.price ?? "")
  return parsed ? parsed.amount : null
}

function addedTime(product: Product): number {
  return product.addedDate ? Date.parse(`${product.addedDate}T00:00:00Z`) || 0 : 0
}

export default function ProductFilters({
  products,
  onFilterChange,
  onReset,
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

  const skinConcerns = useMemo(
    () =>
      [
        ...new Set(
          products.flatMap((product) => (product as FilterableProduct).skinConcerns ?? []),
        ),
      ].sort(),
    [products],
  )

  const tracksStock = useMemo(
    () =>
      products.some(
        (product) => typeof (product as FilterableProduct).inStock === "boolean",
      ),
    [products],
  )

  const prices = useMemo(
    () => products.map(priceOf).filter((value): value is number => value !== null),
    [products],
  )

  const maxCatalogPrice = useMemo(() => {
    if (prices.length === 0) return 0
    return Math.max(10, Math.ceil(Math.max(...prices) / 10) * 10)
  }, [prices])

  const [filters, setFilters] = useState<Filters>(() => ({
    category: "all",
    priceRange: [0, maxCatalogPrice],
    rating: 0,
    skinConcern: [],
    inStock: false,
    sortBy: "featured",
  }))

  // Missing prices pass the default range but are excluded once the shopper
  // narrows the price, so unpriced rows never appear under "$0–$20".
  const priceFilterActive =
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxCatalogPrice

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      if (filters.category !== "all" && !product.categories.includes(filters.category)) {
        return false
      }

      const price = priceOf(product)
      if (price === null) {
        if (priceFilterActive) return false
      } else if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      if (filters.rating > 0 && (product.rating ?? 0) < filters.rating) {
        return false
      }

      if (filters.skinConcern.length > 0) {
        const concerns = (product as FilterableProduct).skinConcerns ?? []
        if (!filters.skinConcern.some((concern) => concerns.includes(concern))) {
          return false
        }
      }

      if (filters.inStock && (product as FilterableProduct).inStock !== true) {
        return false
      }

      return true
    })

    function byPrice(a: Product, b: Product): number {
      const priceA = priceOf(a)
      const priceB = priceOf(b)
      if (priceA === null && priceB === null) return 0
      if (priceA === null) return 1
      if (priceB === null) return -1
      return priceA - priceB
    }

    return list.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return byPrice(a, b)
        case "price-high":
          return byPrice(b, a)
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0)
        case "newest":
          return addedTime(b) - addedTime(a)
        case "featured":
        default:
          return 0
      }
    })
  }, [products, filters, priceFilterActive])

  useEffect(() => {
    onFilterChange(filteredProducts)
  }, [filteredProducts, onFilterChange])

  const active =
    filters.category !== "all" ||
    priceFilterActive ||
    filters.rating > 0 ||
    filters.skinConcern.length > 0 ||
    filters.inStock ||
    filters.sortBy !== "featured"

  const reset = () => {
    setFilters({
      category: "all",
      priceRange: [0, maxCatalogPrice],
      rating: 0,
      skinConcern: [],
      inStock: false,
      sortBy: "featured",
    })
    onReset?.()
  }

  const selectClass =
    "mt-2 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-midnight focus-visible:outline-2"

  return (
    <div className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg text-midnight">Filters</h3>
        {active && (
          <button
            type="button"
            onClick={reset}
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
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({ ...current, category: event.target.value }))
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
              Max price: ${filters.priceRange[1]}
            </label>
            <input
              id="filter-price"
              type="range"
              min="0"
              max={maxCatalogPrice}
              step="1"
              value={filters.priceRange[1]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priceRange: [0, Number(event.target.value)],
                }))
              }
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
              aria-pressed={filters.rating === 0}
              onClick={() => setFilters((current) => ({ ...current, rating: 0 }))}
              className={`h-8 rounded-lg px-2.5 text-xs font-bold transition-colors ${
                filters.rating === 0
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
                aria-pressed={filters.rating === rating}
                onClick={() => setFilters((current) => ({ ...current, rating }))}
                className={`inline-flex h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                  filters.rating === rating
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
            value={filters.sortBy}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sortBy: event.target.value as SortBy,
              }))
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

        {skinConcerns.length > 0 && (
          <fieldset className="sm:col-span-2 lg:col-span-4">
            <legend className="text-xs font-bold uppercase tracking-[0.14em] text-glacier">
              Skin concerns
            </legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {skinConcerns.map((concern) => (
                <label key={concern} className="flex items-center gap-2 text-sm text-winter">
                  <input
                    type="checkbox"
                    checked={filters.skinConcern.includes(concern)}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setFilters((current) => ({
                        ...current,
                        skinConcern: checked
                          ? [...current.skinConcern, concern]
                          : current.skinConcern.filter((entry) => entry !== concern),
                      }))
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  {concern}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {tracksStock && (
          <label className="flex items-center gap-2 text-sm text-winter sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(event) =>
                setFilters((current) => ({ ...current, inStock: event.target.checked }))
              }
              className="h-4 w-4 rounded border-input"
            />
            In stock only
          </label>
        )}
      </div>
    </div>
  )
}
