"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { type Product } from "@/lib/products"
import { usePreferences } from "@/lib/preferences"
import {
  defaultShopFilters,
  parseShopQuery,
  shopHref,
  type ShopFilters,
} from "@/lib/shop-params"
import ProductCard from "./product-card"
import ProductDialog from "./product-dialog"
import ProductFilters from "./products/ProductFilters"
import ProductSearch from "./products/ProductSearch"

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

type ShopProps = {
  /** The full catalog, used for filter options and related products. */
  products: Product[]
  /** The server-filtered result set for the current URL. */
  results: Product[]
  initialQuery: string
  initialFilters: ShopFilters
  /** The query those results were computed for. */
  serverQuery: string
  maxCatalogPrice: number
}

export default function Shop({
  products,
  results,
  initialQuery,
  initialFilters,
  serverQuery,
  maxCatalogPrice,
}: ShopProps) {
  const router = useRouter()
  const { t } = usePreferences()
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState(initialFilters)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )
  const shown = results.slice(0, visibleCount)
  const related = useMemo(
    () => relatedFor(selected, productById),
    [selected, productById],
  )

  // The URL is the source of truth for the server query. Keep a ref so a
  // navigation is only issued when the URL would actually change.
  const lastHref = useRef(shopHref({ q: initialQuery, filters: initialFilters }, maxCatalogPrice))

  const commit = useCallback(
    (nextQuery: string, nextFilters: ShopFilters) => {
      const href = shopHref({ q: nextQuery, filters: nextFilters }, maxCatalogPrice)
      if (href === lastHref.current) return
      lastHref.current = href
      startTransition(() => router.replace(href, { scroll: false }))
    },
    [maxCatalogPrice, router, startTransition],
  )

  // Browser back/forward changes the URL outside our state. Next re-renders
  // the page, but the draft filters and search box also need to follow.
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseShopQuery(
        Object.fromEntries(new URLSearchParams(window.location.search)),
      )
      const nextFilters: ShopFilters = {
        category: parsed.filters.category,
        maxPrice: Math.min(parsed.filters.maxPrice ?? maxCatalogPrice, maxCatalogPrice),
        rating: parsed.filters.rating,
        sort: parsed.filters.sort,
      }
      setQuery(parsed.q)
      setFilters(nextFilters)
      setVisibleCount(PAGE_SIZE)
      lastHref.current = shopHref({ q: parsed.q, filters: nextFilters }, maxCatalogPrice)
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [maxCatalogPrice])

  const handleQueryChange = useCallback(
    (next: string) => {
      setQuery(next)
      setVisibleCount(PAGE_SIZE)
      commit(next, filters)
    },
    [commit, filters],
  )

  const handleFilterChange = useCallback(
    (next: ShopFilters) => {
      setFilters(next)
      setVisibleCount(PAGE_SIZE)
      commit(query, next)
    },
    [commit, query],
  )

  const reset = () => {
    const nextFilters = defaultShopFilters(maxCatalogPrice)
    setQuery("")
    setFilters(nextFilters)
    setVisibleCount(PAGE_SIZE)
    commit("", nextFilters)
  }

  return (
    <section id="shop" aria-labelledby="shop-title" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-secondary-600">{t("shop.eyebrow")}</p>
          <h2 id="shop-title" className="font-display text-4xl font-medium text-midnight sm:text-5xl">
            {t("shop.title")}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t("shop.subtitle", { count: products.length })}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("shop.affiliate")}</p>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProductSearch
            value={query}
            resultQuery={serverQuery}
            results={results}
            isPending={isPending}
            onChange={handleQueryChange}
          />
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {t("shop.showing", { shown: shown.length, total: results.length })}
          </p>
        </div>

        <div className="mt-4">
          <ProductFilters
            products={products}
            value={filters}
            maxCatalogPrice={maxCatalogPrice}
            onChange={handleFilterChange}
            onReset={reset}
            isPending={isPending}
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t("product.affiliateNote")}
        </p>

        <div aria-busy={isPending} className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {results.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-input bg-white/60 px-6 py-16 text-center">
              <p className="font-display text-xl text-midnight">
                {t("shop.emptyTitle")}
              </p>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-primary-600"
              >
                <X className="h-4 w-4" aria-hidden="true" /> {t("shop.clear")}
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((p, index) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpen={setSelected}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          {shown.length < results.length && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="rounded-full border border-secondary-600 px-8 py-3 text-sm font-bold text-secondary-700 transition-colors hover:bg-secondary-600 hover:text-white"
              >
                {t("shop.showMore")}
              </button>
            </div>
          )}
        </div>
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
