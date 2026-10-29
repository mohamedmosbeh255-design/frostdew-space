"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  formatAddedDate,
  formatNumber,
  formatPrice,
  formatRating,
  storeLabel,
} from "@/lib/format"
import type { Product } from "@/lib/products"

export default function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.brand} ${product.name}"?\n\nThis removes it from Supabase.`,
    )
    if (!confirmed) return

    setDeletingId(product.id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Delete failed.")
        return
      }

      router.refresh()
    } catch {
      setError("Network error while deleting the product.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        {/* table-fixed keeps every column inside the card, so the Actions
            column can never be pushed out of view. Long ids and names are
            truncated instead of widening the table. */}
        <table className="w-full min-w-[48rem] table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">
            All products in Supabase with links to edit or delete each record
          </caption>
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[9%]" />
            <col className="w-[22%]" />
            <col className="w-[8%]" />
            <col className="w-[7%]" />
            <col className="w-[6%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">ID</th>
              <th scope="col" className="px-3 py-2 font-semibold">Brand</th>
              <th scope="col" className="px-3 py-2 font-semibold">Name</th>
              <th scope="col" className="px-3 py-2 font-semibold">Store</th>
              <th scope="col" className="px-3 py-2 font-semibold">Price</th>
              <th scope="col" className="px-3 py-2 font-semibold">Rating</th>
              <th scope="col" className="px-3 py-2 font-semibold">Reviews</th>
              <th scope="col" className="px-3 py-2 font-semibold">Added</th>
              <th scope="col" className="px-3 py-2 font-semibold">Related</th>
              {/* Sticky so Edit/Delete stay reachable when narrower screens scroll the table. */}
              <th
                scope="col"
                className="sticky right-0 z-10 border-l border-border bg-muted px-3 py-2 text-right font-semibold"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <span
                    title={product.id}
                    className="block truncate font-mono text-xs text-muted-foreground"
                  >
                    {product.id}
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold text-midnight">
                  <span className="block overflow-hidden text-ellipsis">{product.brand}</span>
                </td>
                <td className="px-3 py-2 text-midnight">
                  <span title={product.name} className="line-clamp-2">
                    {product.name}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">{storeLabel(product.store)}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {product.price ? formatPrice(product.price) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {product.rating !== undefined ? formatRating(product.rating) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {product.reviewCount !== undefined ? formatNumber(product.reviewCount) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {/* Month + year only, e.g. "Oct 2026" (lib/format.ts). */}
                  {product.addedDate ? (
                    (() => {
                      const label = formatAddedDate(product.addedDate) ?? product.addedDate
                      return <time dateTime={product.addedDate}>{label}</time>
                    })()
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {product.relatedProducts && product.relatedProducts.length > 0 ? (
                    <span
                      aria-label={`${product.relatedProducts.length} related products`}
                      className="inline-flex min-w-6 justify-center rounded-full bg-ice px-2 py-0.5 text-xs font-bold text-winter"
                    >
                      {product.relatedProducts.length}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="sticky right-0 border-l border-border bg-card px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/edit/${encodeURIComponent(product.id)}`}
                      className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-semibold text-winter transition-colors hover:bg-ice"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      aria-label={`Delete ${product.brand} ${product.name}`}
                      className="whitespace-nowrap rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                    >
                      {deletingId === product.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
