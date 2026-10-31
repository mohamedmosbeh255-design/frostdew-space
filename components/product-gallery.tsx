"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getProductGallery } from "@/lib/product-gallery"
import type { Product } from "@/lib/products"
import OptimizedImage from "@/components/ui/OptimizedImage"

export default function ProductGallery({ product }: { product: Product }) {
  const sources = useMemo(() => getProductGallery(product), [product])
  const [activeIndex, setActiveIndex] = useState(0)
  const [failed, setFailed] = useState<Set<string>>(() => new Set())

  const visible = sources.filter((source) => !failed.has(source))
  const safeIndex =
    visible.length === 0 ? 0 : Math.min(activeIndex, visible.length - 1)
  const current = visible[safeIndex]

  useEffect(() => {
    setActiveIndex(0)
    setFailed(new Set())
  }, [product.id])

  useEffect(() => {
    if (visible.length > 0 && activeIndex >= visible.length) setActiveIndex(0)
  }, [activeIndex, visible.length])

  useEffect(() => {
    if (visible.length < 2) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + visible.length) % visible.length)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % visible.length)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible.length])

  const markFailed = (source: string) => {
    setFailed((currentFailed) => {
      const next = new Set(currentFailed)
      next.add(source)
      return next
    })
  }

  const showPrevious = () => {
    if (visible.length < 2) return
    setActiveIndex((index) => (safeIndex - 1 + visible.length) % visible.length)
  }

  const showNext = () => {
    if (visible.length < 2) return
    setActiveIndex((index) => (safeIndex + 1) % visible.length)
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="relative aspect-square w-full bg-white">
        {current ? (
          <OptimizedImage
            key={current}
            src={current}
            alt={`${product.brand} ${product.name} — image ${safeIndex + 1} of ${visible.length}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            referrerPolicy="no-referrer"
            className="h-full w-full"
            imageClassName="h-full w-full object-contain p-6"
            onError={() => markFailed(current)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-ice font-display text-sm tracking-[0.2em] text-winter">
            {product.brand}
          </div>
        )}

        {visible.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous product image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-winter shadow transition-colors hover:bg-ice"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next product image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-winter shadow transition-colors hover:bg-ice"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[0.65rem] font-semibold text-winter shadow">
              {safeIndex + 1} / {visible.length}
            </span>
          </>
        )}
      </div>

      {visible.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto border-t border-border bg-white p-3"
          aria-label="Product images"
        >
          {visible.map((source, index) => (
            <button
              key={source}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1} of ${visible.length}`}
              aria-pressed={index === safeIndex}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white transition-colors ${
                index === safeIndex
                  ? "border-winter ring-2 ring-winter/20"
                  : "border-border hover:bg-ice"
              }`}
            >
              <OptimizedImage
                src={source}
                alt=""
                fill
                sizes="56px"
                referrerPolicy="no-referrer"
                className="h-full w-full"
                imageClassName="h-full w-full object-contain p-1"
                onError={() => markFailed(source)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
