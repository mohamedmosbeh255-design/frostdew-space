"use client"

import Link from "next/link"
import { ArrowUpRight, ExternalLink, FlaskConical, Quote, Sparkles, Star } from "lucide-react"
import { PriceTag, ProductImage } from "@/components/product-card"
import { formatRating, reviewCountLabel } from "@/lib/format"
import { getProductStoreLinks } from "@/lib/store-links"
import type { RoutineProductSuggestion, SuggestionCategory } from "@/lib/routine-recommendations"

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  cleanser: "Cleanse",
  toner: "Tone / treat",
  serum: "Treat",
  moisturizer: "Moisturize",
  sunscreen: "Protect",
  mask: "Weekly mask",
  lip: "Lip care",
}

export default function ProductSuggestion({
  suggestion,
}: {
  suggestion: RoutineProductSuggestion
}) {
  const { product, knowledge, matchReasons } = suggestion
  const links = getProductStoreLinks(product)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white/85 shadow-soft">
      <div className="flex gap-4 border-b border-border/70 bg-gradient-to-br from-snow to-ice/40 p-4 sm:p-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-white sm:h-28 sm:w-28">
          <ProductImage
            product={product}
            className="h-full w-full"
            imageClassName="h-full w-full object-contain p-2"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-winter px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white">
              {CATEGORY_LABELS[knowledge.category]}
            </span>
            {product.bestseller && (
              <span className="rounded-full bg-accent-700 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white">
                Bestseller
              </span>
            )}
          </div>
          <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary-600">
            {product.brand}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-medium leading-snug text-midnight">
            <Link
              href={`/products/${product.id}`}
              className="underline-offset-4 transition-colors hover:text-primary-700 hover:underline"
            >
              {product.name}
            </Link>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {product.rating !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-midnight">
                <Star className="h-3.5 w-3.5 fill-amber-cta text-amber-cta" aria-hidden="true" />
                {formatRating(product.rating)}
                {product.reviewCount !== undefined && (
                  <span className="font-normal text-muted-foreground">
                    ({reviewCountLabel(product.reviewCount)})
                  </span>
                )}
              </span>
            )}
            {product.price && <PriceTag product={product} />}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-glacier">
            Why this match
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {matchReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-glacier">
            <Sparkles className="h-3 w-3 text-amber-cta" aria-hidden="true" />
            Why it stands out
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-winter">{knowledge.why}</p>
        </div>

        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-glacier">
            Key ingredients
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {knowledge.ingredients.map((ingredient) => (
              <li key={ingredient.name} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-glacier" aria-hidden="true" />
                <span className="text-winter">
                  <strong className="font-semibold text-midnight">{ingredient.name}</strong>
                  <span className="text-muted-foreground"> — {ingredient.function}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-glacier/20 bg-snow/80 p-3.5">
          <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-winter">
            <FlaskConical className="h-3.5 w-3.5 text-glacier" aria-hidden="true" />
            What the evidence says
          </p>
          <p className="mt-1.5 flex gap-2 text-sm leading-relaxed text-winter">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-glacier/70" aria-hidden="true" />
            <span>{knowledge.evidence}</span>
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-midnight">Best for:</strong> {knowledge.bestFor}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((link, index) => (
                <a
                  key={`${link.key}:${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  aria-label={`Check price for ${product.brand} ${product.name} on ${link.label}`}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    index === 0
                      ? "bg-accent-700 text-white hover:bg-accent-700/90"
                      : "border border-glacier/40 bg-white text-winter hover:bg-ice"
                  }`}
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary-600 underline decoration-primary-500/40 underline-offset-2 transition-colors hover:text-primary-700"
          >
            Full product details
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
