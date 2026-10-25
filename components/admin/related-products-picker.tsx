"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

export type RelatedProductOption = {
  id: string
  brand: string
  name: string
}

/**
 * Searchable multi-select for `relatedProducts`. Options are intentionally a trimmed
 * projection of each product so the admin bundle does not ship full product records.
 */
export default function RelatedProductsPicker({
  options,
  currentId,
  selected,
  onChange,
}: {
  options: RelatedProductOption[]
  currentId: string
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState("")

  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return options.filter((option) => {
      if (option.id === currentId) return false
      if (!term) return true
      return `${option.brand} ${option.name} ${option.id}`.toLowerCase().includes(term)
    })
  }, [options, currentId, query])

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="related-search"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Search products
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-glacier"
            aria-hidden="true"
          />
          <input
            id="related-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by brand, name, or id"
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-white py-2 pl-10 pr-3 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
          />
        </div>
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected related products">
          {selected.map((id) => {
            const option = byId.get(id)
            const label = option ? `${option.brand} ${option.name}` : id
            return (
              <li key={id}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ice px-3 py-1 text-xs font-semibold text-winter">
                  {label}
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${label}`}
                    className="rounded-full p-0.5 text-winter transition-colors hover:bg-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-white">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No matching products.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm hover:bg-ice/60">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => toggle(option.id)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-winter focus-visible:ring-2 focus-visible:ring-glacier"
                  />
                  <span className="min-w-0">
                    <span className="font-semibold text-midnight">{option.brand}</span>{" "}
                    <span className="text-midnight">{option.name}</span>
                    <span className="block truncate font-mono text-[0.7rem] text-muted-foreground">
                      {option.id}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.length === 0
          ? "No related products selected."
          : `${selected.length} selected. The first six are shown in the product dialog.`}
      </p>
    </div>
  )
}
