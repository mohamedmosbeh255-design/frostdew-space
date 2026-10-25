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
  rating: number | null
  reviews: number
  size: string
  bestseller: boolean
}

export const PRODUCTS: Product[] = data as Product[]

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

export type SortKey = "featured" | "rating" | "reviews" | "name"

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "rating", label: "Top rated" },
  { id: "reviews", label: "Most reviewed" },
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
  if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews)
  else if (sort === "reviews") list.sort((a, b) => b.reviews - a.reviews)
  else if (sort === "name") list.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
  return list
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US")
}
