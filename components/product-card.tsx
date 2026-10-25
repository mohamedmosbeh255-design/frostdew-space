"use client"

import { useState } from "react"
import { ExternalLink, Star } from "lucide-react"
import {
  formatAddedDate,
  formatPrice,
  formatRating,
  reviewCountLabel,
  storeLabel,
} from "@/lib/format"
import { type Product } from "@/lib/products"

export function Rating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const filled = Math.round(rating)
  const label =
    reviewCount === undefined
      ? `Rated ${formatRating(rating)} out of 5`
      : `Rated ${formatRating(rating)} out of 5 from ${reviewCountLabel(reviewCount)}`
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5" aria-label={label}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <Star
            key={step}
            className={
              step <= filled
                ? "h-3.5 w-3.5 fill-amber-cta text-amber-cta"
                : "h-3.5 w-3.5 text-glacier/40"
            }
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-midnight" aria-hidden="true">
        {formatRating(rating)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          ({reviewCountLabel(reviewCount)})
        </span>
      )}
    </div>
  )
}

export function ProductImage({ product, className }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-ice font-display text-sm tracking-[0.2em] text-winter ${className ?? ""}`}>
        {product.brand}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={`${product.brand} ${product.name}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

export function BuyLink({ product, className }: { product: Product; className?: string }) {
  const label = storeLabel(product.store)
  return (
    <div className="flex flex-col gap-2">
      <a
        href={product.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={`Check price on ${label}`}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-amber-cta px-4 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] ${className ?? ""}`}
      >
        {label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <p className="text-center text-xs leading-snug text-muted-foreground">
        Price and availability may change. Please verify on the store.
      </p>
    </div>
  )
}

export default function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: (product: Product) => void
}) {
  return (
    <article className="card-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`View details for ${product.brand} ${product.name}`}
        className="flex flex-1 flex-col text-left focus-visible:-outline-offset-4"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <ProductImage
            product={product}
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {product.bestseller && (
            <span className="glass-chip absolute left-3 top-3 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-winter">
              Bestseller
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-glacier">{product.brand}</p>
          <h3 className="line-clamp-2 font-display text-lg font-medium leading-snug text-midnight">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.short}</p>
          {(product.rating !== undefined || product.price || product.addedDate) && (
            <div className="mt-auto flex flex-col gap-1 pt-2">
              {product.rating !== undefined && (
                <Rating rating={product.rating} reviewCount={product.reviewCount} />
              )}
              {product.price && (
                <p className="text-sm font-semibold text-midnight">{formatPrice(product.price)}</p>
              )}
              {product.addedDate && (
                <p className="text-xs text-muted-foreground">
                  Added: {formatAddedDate(product.addedDate) ?? product.addedDate}
                </p>
              )}
            </div>
          )}
        </div>
      </button>
      <div className="mt-auto px-5 pb-5">
        <BuyLink product={product} className="w-full" />
      </div>
    </article>
  )
}
