import { NextResponse } from "next/server"
import { readCatalog } from "@/lib/product-catalog"

export const dynamic = "force-dynamic"

type AudioCatalogProduct = {
  id: string
  brand: string
  name: string
  description: string
  image: string
}

/**
 * Small read-only projection of the catalog for the audio concierge. It is
 * fetched only when the visitor opens the player, never during first paint.
 */
export async function GET() {
  try {
    const products = await readCatalog()
    const payload: AudioCatalogProduct[] = products.map((product) => ({
      id: product.id,
      brand: product.brand,
      name: product.name,
      description: (product.description || product.short || "").trim(),
      image: product.image,
    }))

    return NextResponse.json(
      { products: payload },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    )
  } catch (error) {
    console.error("[audio] Unable to read the catalog:", error)
    return NextResponse.json({ products: [] }, { status: 503 })
  }
}
