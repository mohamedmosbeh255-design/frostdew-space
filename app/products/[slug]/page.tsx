import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { ArrowLeft, Check } from "lucide-react"
import PageShell from "@/components/page-shell"
import ProductGallery from "@/components/product-gallery"
import { BuyLink, PriceTag, ProductImage, Rating } from "@/components/product-card"
import { formatAddedDateFull } from "@/lib/format"
import { getProductBySlug, readCatalog } from "@/lib/product-catalog"
import { CATEGORIES, type Product } from "@/lib/products"
import { generateProductSchema, productImageUrls } from "@/lib/seo/product-schema"
import { AFFILIATE_PROXIMITY_NOTE, SITE_URL } from "@/lib/site"

type Props = {
  params: Promise<{ slug: string }>
}

const MAX_RELATED = 4

/** Meta descriptions should be unique and short; `short` is written for this. */
function metaDescription(product: Product): string {
  const text = (product.short || product.description).trim()
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Read metadata per request so admin edits are reflected immediately.
  await connection()
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
      robots: { index: false, follow: true },
    }
  }

  const description = metaDescription(product)
  const images = productImageUrls(product, SITE_URL).map((url) => ({
    url,
    alt: `${product.brand} ${product.name}`,
  }))

  return {
    title: { absolute: `${product.name} | FrostDew K-Beauty` },
    description,
    keywords: [
      product.name,
      product.fullName,
      product.brand,
      "K-beauty",
      "Korean skincare",
      ...product.categories.map(
        (category) => CATEGORIES.find((entry) => entry.id === category)?.label ?? category,
      ),
    ],
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/products/${product.id}`,
      siteName: "FrostDew",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: images.map((image) => image.url),
    },
  }
}

function relatedProducts(product: Product, catalog: Product[]): Product[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]))
  const related: Product[] = []
  const seen = new Set<string>([product.id])

  for (const id of product.relatedProducts ?? []) {
    const match = byId.get(id)
    if (!match || seen.has(match.id)) continue
    seen.add(match.id)
    related.push(match)
    if (related.length === MAX_RELATED) return related
  }

  // Fall back to the same category so every product page links deeper into
  // the catalog for crawlers and shoppers alike.
  for (const entry of catalog) {
    if (seen.has(entry.id)) continue
    if (!entry.categories.some((category) => product.categories.includes(category))) continue
    seen.add(entry.id)
    related.push(entry)
    if (related.length === MAX_RELATED) break
  }

  return related
}

export default async function ProductPage({ params }: Props) {
  await connection()
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const catalog = await readCatalog()
  const related = relatedProducts(product, catalog)
  const addedLabel = product.addedDate ? formatAddedDateFull(product.addedDate) : null

  const categoryLabels = product.categories.map(
    (category) => CATEGORIES.find((entry) => entry.id === category)?.label ?? category,
  )

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateProductSchema(product, SITE_URL) }}
      />

      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-ice/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-frost/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <Link
            href="/#shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-winter transition-colors hover:text-midnight"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the collection
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
              <ProductGallery product={product} />
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">
                  {product.brand}
                </p>
                <h1 className="mt-2 font-display text-3xl font-medium leading-snug text-midnight sm:text-4xl">
                  {product.fullName}
                </h1>
              </div>

              {product.rating !== undefined && (
                <Rating rating={product.rating} reviewCount={product.reviewCount} />
              )}

              <p className="text-lg leading-relaxed text-winter">{product.short}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <PriceTag product={product} size="lg" />
                {addedLabel && (
                  <span className="text-xs text-muted-foreground">
                    Added <time dateTime={product.addedDate}>{addedLabel}</time>
                  </span>
                )}
              </div>

              <BuyLink product={product} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {AFFILIATE_PROXIMITY_NOTE}
              </p>

              {categoryLabels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-winter"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {product.features.length > 1 && (
                <ul className="flex flex-col gap-2 text-sm">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="mt-12 max-w-3xl">
            <h2 className="font-display text-2xl font-medium text-midnight">About this product</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{product.description}</p>
          </section>

          {related.length > 0 && (
            <section className="mt-14" aria-labelledby="related-title">
              <h2 id="related-title" className="font-display text-2xl font-medium text-midnight">
                You may also like
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/products/${entry.id}`}
                    className="group flex gap-3 rounded-2xl border border-border bg-white/75 p-3 transition-colors hover:bg-ice/60"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                      <ProductImage
                        product={entry}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-glacier">
                        {entry.brand}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-midnight">
                        {entry.name}
                      </p>
                      <div className="mt-1">
                        <PriceTag product={entry} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  )
}
