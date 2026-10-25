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
      `Delete "${product.brand} ${product.name}"?\n\nThis removes it from data/products.json.`,
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
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            All products in data/products.json with links to edit or delete each record
          </caption>
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
              <th scope="col" className="px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">{product.id}</span>
                </td>
                <td className="px-3 py-2 font-semibold text-midnight">{product.brand}</td>
                <td className="px-3 py-2 text-midnight">{product.name}</td>
                <td className="px-3 py-2">{storeLabel(product.store)}</td>
                <td className="px-3 py-2">{product.price ? formatPrice(product.price) : "—"}</td>
                <td className="px-3 py-2">
                  {product.rating !== undefined ? formatRating(product.rating) : "—"}
                </td>
                <td className="px-3 py-2">
                  {product.reviewCount !== undefined ? formatNumber(product.reviewCount) : "—"}
                </td>
                <td className="px-3 py-2">
                  {product.addedDate ? (formatAddedDate(product.addedDate) ?? product.addedDate) : "—"}
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
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/edit/${encodeURIComponent(product.id)}`}
                      className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-winter transition-colors hover:bg-ice"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      aria-label={`Delete ${product.brand} ${product.name}`}
                      className="rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
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
