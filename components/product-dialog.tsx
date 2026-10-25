"use client"

import { useEffect, useRef } from "react"
import { Check, X } from "lucide-react"
import type { Product } from "@/lib/products"
import { BuyLink, ProductImage } from "./product-card"

export default function ProductDialog({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

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
        <div className="relative grid max-h-[90svh] overflow-y-auto md:grid-cols-2">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-winter shadow transition-colors hover:bg-ice"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="bg-white">
            <ProductImage
              product={product}
              className="aspect-square h-full w-full object-contain p-6"
            />
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">{product.brand}</p>
            <h2 id="product-dialog-title" className="font-display text-2xl font-medium leading-snug sm:text-3xl">
              {product.name}
            </h2>
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
              <BuyLink product={product} className="w-full py-3" />
              <p className="text-center text-xs text-muted-foreground">
                Prices and availability change. Check the store for today&apos;s price.
              </p>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
