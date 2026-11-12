import Link from "next/link"
import { connection } from "next/server"
import { ArrowRight, Beaker, ClipboardList, Sparkles } from "lucide-react"
import Hero from "@/components/hero"
import Shop from "@/components/shop"
import SiteFooter from "@/components/site-footer"
import SiteHeader from "@/components/site-header"
import Snowfall from "@/components/snowfall"
import { readCatalog } from "@/lib/product-catalog"
import { getOrderedProducts } from "@/lib/product-rotation"
import { searchProducts, type ProductSearchFilters } from "@/lib/search"
import { type Product } from "@/lib/products"
import { catalogMaxPrice, parseShopQuery } from "@/lib/shop-params"
import { readSiteSettings } from "@/lib/site-settings"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const TOOLS = [
  {
    href: "/analyzer",
    icon: Beaker,
    title: "Ingredient Analyzer",
    description: "Paste any product label and we'll decode every ingredient",
    badge: "Free Tool",
  },
  {
    href: "/routine-decoder",
    icon: ClipboardList,
    title: "Routine Decoder",
    description: "Tell us your routine and we'll score it",
    badge: "New",
  },
] as const

function ToolsSection() {
  return (
    <section
      id="tools"
      aria-labelledby="tools-title"
      className="relative isolate overflow-hidden bg-midnight py-14 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.34em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Skincare Lab
            </p>
            <h2
              id="tools-title"
              className="mt-3 font-display text-3xl font-medium leading-tight text-white sm:text-4xl"
            >
              FrostDew Tools
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ice/70">
              Free, browser-based tools to help you understand what is in your products — and
              whether your routine is working for you.
            </p>
          </div>
          <p className="text-xs font-semibold text-ice/50">
            No account needed · Nothing is uploaded
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-cyan-200/15 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/[0.07] hover:shadow-[0_24px_70px_-24px_rgba(34,211,238,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl transition-colors duration-300 group-hover:bg-cyan-400/25"
                />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/25 transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-400/20">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="relative mt-5 font-display text-xl font-medium text-white sm:text-2xl">
                  {tool.title}
                </h3>
                <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-ice/70">
                  {tool.description}
                </p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300">
                  Open tool
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
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
  // Homepage-only rotation: when the visitor has not chosen an explicit sort,
  // pin products added in the last 36h to the top and rotate the rest on a
  // deterministic 12h seed. Explicit sorts (newest, price, rating) are left
  // untouched so the existing sort control keeps working as before.
  const applyRotation = (list: Product[]) =>
    query.filters.sort === "featured" ? getOrderedProducts(list) : list

  const results =
    activeMaxPrice === query.filters.maxPrice
      ? applyRotation(initialResults)
      : applyRotation(await searchProducts(query.q, buildFilters(activeMaxPrice)))

  return (
    <>
      <SiteHeader />
      <Snowfall />
      <main>
        <Hero content={content.hero} />
        <ToolsSection />
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
