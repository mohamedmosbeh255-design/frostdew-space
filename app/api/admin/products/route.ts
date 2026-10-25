import { NextResponse } from "next/server"
import { guardRead, guardWrite } from "@/lib/admin/api-guard"
import { InvalidInputError, normalizeProductInput } from "@/lib/admin/product-input"
import { ProductStoreError, readProducts, writeProducts } from "@/lib/admin/products-store"
import { validateProductRecord } from "@/lib/product-rules.mjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const denied = await guardRead()
  if (denied) return denied

  try {
    return NextResponse.json({ products: await readProducts() })
  } catch (error) {
    const message = error instanceof ProductStoreError ? error.message : "Unable to read products."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = await guardWrite(request)
  if (denied) return denied

  let candidate
  try {
    candidate = normalizeProductInput(await request.json())
  } catch (error) {
    const message =
      error instanceof InvalidInputError ? error.message : "Request body must be valid JSON."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const products = await readProducts()
    const { errors, warnings } = validateProductRecord(candidate, { allProducts: products })

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed.", errors, warnings }, { status: 400 })
    }

    products.push(candidate)
    await writeProducts(products)

    return NextResponse.json({ ok: true, product: candidate, warnings }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof ProductStoreError ? error.message : "Unable to save the product."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
