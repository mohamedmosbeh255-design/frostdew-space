import { connection } from "next/server"
import Hero from "@/components/hero"
import Shop from "@/components/shop"
import SiteFooter from "@/components/site-footer"
import SiteHeader from "@/components/site-header"
import Snowfall from "@/components/snowfall"
import { readCatalog } from "@/lib/product-catalog"
import { searchProducts, type ProductSearchFilters } from "@/lib/search"
import { catalogMaxPrice, parseShopQuery } from "@/lib/shop-params"
import { readSiteSettings } from "@/lib/site-settings"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: Props) {
  // Read content and products per request so admin edits appear without a rebuild.
  await connection()

  const query = parseShopQuery(await searchParams)

  // Filters are applied by the server query. Price bounds and sorting happen
  // inside `searchProducts` because prices are stored as display strings.
  const buildFilters = (maxPrice: number | null): ProductSearchFilters => {
    const filters: ProductSearchFilters = {}
    if (query.filters.category !== "all") filters.categories = [query.filters.category]
    if (maxPrice !== null) filters.maxPrice = maxPrice
    if (query.filters.rating > 0) filters.minRating = query.filters.rating
    if (query.filters.sort !== "featured") filters.sort = query.filters.sort
    return filters
  }

  const [{ content }, products, initialResults] = await Promise.all([
    readSiteSettings(),
    readCatalog(),
    searchProducts(query.q, buildFilters(query.filters.maxPrice)),
  ])

  const maxPrice = catalogMaxPrice(products)

  // A ceiling at or above the catalog maximum is not a filter. Without this,
  // an edited URL such as `?maxPrice=30` would hide unpriced products while
  // the slider still looked inactive.
  const activeMaxPrice =
    query.filters.maxPrice !== null && query.filters.maxPrice < maxPrice
      ? query.filters.maxPrice
      : null
  const results =
    activeMaxPrice === query.filters.maxPrice
      ? initialResults
      : await searchProducts(query.q, buildFilters(activeMaxPrice))

  return (
    <>
      <SiteHeader />
      <Snowfall />
      <main>
        <Hero content={content.hero} />
        <Shop
          products={products}
          results={results}
          initialQuery={query.q}
          serverQuery={query.q}
          initialFilters={{
            category: query.filters.category,
            maxPrice: activeMaxPrice ?? maxPrice,
            rating: query.filters.rating,
            sort: query.filters.sort,
          }}
          maxCatalogPrice={maxPrice}
        />
      </main>
      <SiteFooter />
    </>
  )
}
