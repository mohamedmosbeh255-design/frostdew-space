import data from "@/data/products.json"

export interface Product {
  id: string
  brand: string
  name: string
  fullName: string
  categories: string[]
  short: string
  description: string
  features: string[]
  image: string
  url: string
  store: string
  bestseller: boolean
  /** Display price including currency symbol, e.g. "$24.99". Shown with a "~" prefix. */
  price?: string
  /** Manual editorial rating from 1 to 5. */
  rating?: number
  /** ISO date the product was added, YYYY-MM-DD. Rendered as "Sep 2026". */
  addedDate?: string
}

export const PRODUCTS: Product[] = data as Product[]

const STORE_LABELS: Record<string, string> = {
  Amazon: "Amazon US",
  "Amazon UK": "Amazon UK",
  Stylevana: "Stylevana",
}

export function storeLabel(store: string): string {
  return STORE_LABELS[store] ?? store
}

const addedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatAddedDate(iso: string): string | null {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return addedDateFormatter.format(date)
}

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "masks", label: "Masks" },
  { id: "serums", label: "Serums" },
  { id: "toners", label: "Toners" },
  { id: "moisturizers", label: "Moisturizers" },
  { id: "sunscreens", label: "Sunscreens" },
  { id: "cleansers", label: "Cleansers" },
  { id: "lip-care", label: "Lip Care" },
  { id: "sets", label: "Sets" },
] as const

export type SortKey = "featured" | "name"

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "name", label: "Name A–Z" },
]

export function countByCategory(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = { all: products.length }
  for (const p of products) for (const c of p.categories) counts[c] = (counts[c] ?? 0) + 1
  return counts
}

export function filterAndSort(
  products: Product[],
  category: string,
  query: string,
  sort: SortKey,
): Product[] {
  const q = query.trim().toLowerCase()
  const list = products.filter((p) => {
    if (category !== "all" && !p.categories.includes(category)) return false
    if (!q) return true
    return `${p.brand} ${p.fullName} ${p.short}`.toLowerCase().includes(q)
  })
  if (sort === "name") list.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
  return list
}
