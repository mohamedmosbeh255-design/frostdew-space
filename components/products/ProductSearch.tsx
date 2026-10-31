"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { CATEGORIES, type Product } from "@/lib/products"
import { ProductImage } from "@/components/product-card"

type ProductSearchProps = {
  /** The committed search term; follows the URL. */
  value: string
  /** The term the server results were computed for. */
  resultQuery: string
  /** Server matches for `resultQuery`, used as suggestions. */
  results: Product[]
  /** A server query is in flight. */
  isPending: boolean
  /** Called after the debounce and on submit, which triggers the server query. */
  onChange: (value: string) => void
}

const SUGGESTION_LIMIT = 5
const DEBOUNCE_MS = 300

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function categoryLabel(product: Product): string | null {
  const id = product.categories[0]
  if (!id) return null
  return CATEGORIES.find((category) => category.id === id)?.label ?? id
}

export default function ProductSearch({
  value,
  resultQuery,
  results,
  isPending,
  onChange,
}: ProductSearchProps) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value)
  const [searchTerm, setSearchTerm] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const term = normalize(searchTerm)
  const synced = term.length > 0 && term === resultQuery
  const suggestions = synced ? results.slice(0, SUGGESTION_LIMIT) : []
  const searching = term.length > 0 && (isPending || term !== resultQuery)

  // Follow external URL changes (back/forward, reset) without overwriting a
  // term the shopper has typed while the previous query is still in flight.
  useEffect(() => {
    const previous = lastValue.current
    lastValue.current = value
    setSearchTerm((current) => (normalize(current) === previous ? value : current))
  }, [value])

  // Debounce so a fast typist triggers one server query, not one per key.
  useEffect(() => {
    if (term === normalize(value)) return
    const timer = setTimeout(() => onChange(term), term ? DEBOUNCE_MS : 0)
    return () => clearTimeout(timer)
  }, [term, value, onChange])

  // Close the popover when clicking anywhere outside the search box.
  useEffect(() => {
    if (!showSuggestions) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [showSuggestions])

  const open = showSuggestions && term.length > 0

  const goToProduct = (product: Product) => {
    // Do not update the input here: that would schedule a debounced search
    // commit and could replace the product navigation.
    setShowSuggestions(false)
    setActiveIndex(-1)
    router.push(`/products/${product.id}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault()
      setShowSuggestions(true)
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault()
      setShowSuggestions(true)
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex])
      } else {
        // Submit immediately instead of waiting for the debounce.
        onChange(term)
        lastValue.current = term
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    } else if (event.key === "Escape") {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const suggestionListId = "product-search-suggestions"
  const activeOptionId =
    activeIndex >= 0 && suggestions[activeIndex]
      ? `product-search-option-${suggestions[activeIndex].id}`
      : undefined

  return (
    <div ref={rootRef} className="relative w-full sm:max-w-md">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-glacier"
          aria-hidden="true"
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={suggestionListId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-busy={searching}
          value={searchTerm}
          onChange={(event) => {
            const next = event.target.value
            setSearchTerm(next)
            setShowSuggestions(normalize(next).length > 0)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (term.length > 0) setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, or categories"
          aria-label="Search products, brands, or categories"
          className="h-11 w-full rounded-full border border-input bg-white pl-10 pr-10 text-sm text-midnight placeholder:text-muted-foreground focus-visible:outline-2"
        />
        {searching && (
          <Loader2
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-glacier"
            aria-hidden="true"
          />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          <ul id={suggestionListId} role="listbox" aria-label="Product suggestions">
            {suggestions.map((product, index) => (
              <li
                key={product.id}
                id={`product-search-option-${product.id}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToProduct(product)}
                  className={`flex w-full items-center gap-3 border-b border-border/70 px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                    index === activeIndex ? "bg-ice/70" : "hover:bg-ice/50"
                  }`}
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                    <ProductImage
                      product={product}
                      className="h-full w-full"
                      imageClassName="h-full w-full object-contain p-1"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-midnight">
                      {product.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {product.brand}
                      {categoryLabel(product) ? ` · ${categoryLabel(product)}` : ""}
                    </span>
                  </span>
                  {product.price && (
                    <span className="shrink-0 text-xs font-semibold text-winter">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {searching && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          )}
          {!searching && synced && suggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No products match “{term}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
