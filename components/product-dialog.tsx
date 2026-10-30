"use client"

import { useEffect, useRef } from "react"
import { Check, X } from "lucide-react"
import { formatAddedDateFull } from "@/lib/format"
import { type Product } from "@/lib/products"
import { AFFILIATE_PROXIMITY_NOTE } from "@/lib/site"
import { BuyLink, PriceTag, ProductImage, Rating } from "./product-card"
import ProductGallery from "./product-gallery"

export default function ProductDialog({
  product,
  related = [],
  onSelectRelated,
  onClose,
}: {
  product: Product | null
  related?: Product[]
  onSelectRelated?: (product: Product) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (product && !dialog.open) {
      dialog.showModal()
      document.body.style.overflow = "hidden"
    }
    if (!product && dialog.open) dialog.close()
    return () => {
      document.body.style.overflow = ""
    }
  }, [product])

  // Switching to a related product keeps the dialog open, so reset the scroll position.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [product?.id])

  // Only render dates we can format; never fall back to the raw stored value.
  const addedLabel = product?.addedDate ? formatAddedDateFull(product.addedDate) : null

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      aria-labelledby="product-dialog-title"
      className="m-auto max-h-[90svh] w-[min(56rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/70 bg-snow p-0 text-midnight shadow-2xl"
    >
      {product && (
        <div
          ref={bodyRef}
          className="relative grid max-h-[90svh] overflow-y-auto md:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-winter shadow transition-colors hover:bg-ice"
          >
            <X className="h-5 w-5" />
          </button>
          <ProductGallery product={product} />
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">{product.brand}</p>
            <h2 id="product-dialog-title" className="font-display text-2xl font-medium leading-snug sm:text-3xl">
              {product.name}
            </h2>
            {product.rating !== undefined && (
              <Rating rating={product.rating} reviewCount={product.reviewCount} />
            )}
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
            {product.features.length > 1 && (
              <ul className="flex flex-col gap-2 text-sm">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-col gap-2">
              {(product.price || addedLabel) && (
                <div className="flex items-baseline justify-between gap-3">
                  {product.price ? (
                    <PriceTag product={product} size="lg" />
                  ) : (
                    <span />
                  )}
                  {product.addedDate && addedLabel && (
                    <p className="text-xs text-muted-foreground">
                      <time
                        dateTime={product.addedDate}
                        title={`Added ${addedLabel}`}
                      >
                        {addedLabel}
                      </time>
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {AFFILIATE_PROXIMITY_NOTE}
              </p>
              <BuyLink product={product} className="w-full" />
            </div>
          </div>

          {related.length > 0 && (
            <section
              aria-labelledby="related-heading"
              className="border-t border-border bg-snow p-6 sm:p-8 md:col-span-2"
            >
              <h3 id="related-heading" className="font-display text-xl text-midnight">
                You may also like
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {related.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRelated?.(item)}
                      aria-label={`View ${item.brand} ${item.name}`}
                      className="flex h-full w-full flex-col gap-1 rounded-xl border border-border bg-white p-2 text-left transition-colors hover:bg-ice focus-visible:outline-2"
                    >
                      <ProductImage
                        product={item}
                        className="aspect-square w-full object-contain p-2"
                      />
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-glacier">
                        {item.brand}
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-midnight">
                        {item.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </dialog>
  )
}
