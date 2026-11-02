"use client"

import { useEffect, useRef } from "react"
import { ExternalLink, X } from "lucide-react"
import type { StorePrice } from "@/lib/products"

/** Formatting a currency is not free, so reuse one instance per code. */
const formatters = new Map<string, Intl.NumberFormat | null>()

/**
 * Renders a stored amount with its ISO 4217 code ("$24.99", "£22.99",
 * "₩19,900"). Falls back to "CODE 24.99" if the code is not a real currency.
 */
export function formatStorePrice(price: number, currency: string): string {
  const code = currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) {
    return `${currency.trim()} ${price.toFixed(2)}`
  }

  let formatter = formatters.get(code)
  if (formatter === undefined) {
    try {
      formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: code })
    } catch {
      formatter = null
    }
    formatters.set(code, formatter)
  }

  return formatter ? formatter.format(price) : `${code} ${price.toFixed(2)}`
}

export default function ComparePricesDialog({
  productName,
  prices,
  open,
  onClose,
}: {
  /** Brand + product name, shown under the title for context. */
  productName: string
  prices: StorePrice[]
  open: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      document.body.style.overflow = "hidden"
    }
    if (!open && dialog.open) dialog.close()

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close()
      }}
      aria-labelledby="compare-prices-title"
      className="m-auto w-[min(48rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/70 bg-snow p-0 text-midnight shadow-2xl backdrop:bg-midnight/40"
    >
      <div className="flex max-h-[85svh] flex-col overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="compare-prices-title" className="font-display text-xl font-medium text-midnight">
              Compare prices
            </h2>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{productName}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-winter shadow-sm transition-colors hover:bg-ice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {prices.map((entry, index) => (
            <li
              key={`${entry.store}:${index}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4"
            >
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-primary-600">
                {entry.store}
              </p>
              <p className="font-display text-lg font-semibold text-midnight">
                {formatStorePrice(entry.price, entry.currency)}
              </p>
              <a
                href={entry.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={`Check price on ${entry.store}`}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent-700 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-700/90"
              >
                Check price
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <p className="px-6 pb-6 text-xs leading-snug text-muted-foreground">
          Prices come from each store and may change. Please verify on the store before buying.
        </p>
      </div>
    </dialog>
  )
}
