import { NextResponse } from "next/server"
import { guardRead, guardWrite } from "@/lib/admin/api-guard"
import { InvalidInputError, normalizeProductInput } from "@/lib/admin/product-input"
import {
  ProductConflictError,
  ProductStoreError,
  deleteProduct,
  productIndexById,
  readProducts,
  updateProduct,
} from "@/lib/admin/products-store"
import { findDuplicateProduct, validateProductRecord } from "@/lib/product-rules.mjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const denied = await guardRead()
  if (denied) return denied

  const { id } = await params
  try {
    const products = await readProducts()
    const index = productIndexById(products, id)
    if (index === -1) return NextResponse.json({ error: "Product not found." }, { status: 404 })
    return NextResponse.json({ product: products[index] })
  } catch (error) {
    const message = error instanceof ProductStoreError ? error.message : "Unable to read products."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const denied = await guardWrite(request)
  if (denied) return denied

  const { id } = await params

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
    const index = productIndexById(products, id)
    if (index === -1) return NextResponse.json({ error: "Product not found." }, { status: 404 })

    // The id is the React key and route param, so it stays immutable after creation.
    candidate.id = id

    // Exclude this record so an unchanged brand + name is always allowed.
    const duplicateNameIndex = findDuplicateProduct(
      products,
      candidate.brand,
      candidate.name,
      index,
    )
    if (duplicateNameIndex !== -1) {
      const match = products[duplicateNameIndex]
      return NextResponse.json(
        {
          error: "A product with this name already exists.",
          field: "name",
          duplicate: { id: match.id, brand: match.brand, name: match.name },
          errors: [
            `A product with this name already exists for ${match.brand} (${match.name}, ${match.id}).`,
          ],
        },
        { status: 409 },
      )
    }

    const { errors, warnings } = validateProductRecord(candidate, {
      allProducts: products,
      selfIndex: index,
    })
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed.", errors, warnings }, { status: 400 })
    }

    const saved = await updateProduct(candidate)

    return NextResponse.json({ ok: true, product: saved, warnings })
  } catch (error) {
    if (error instanceof ProductConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          field: error.field,
          errors: [error.message],
        },
        { status: 409 },
      )
    }

    const message =
      error instanceof ProductStoreError ? error.message : "Unable to save the product."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const denied = await guardWrite(request)
  if (denied) return denied

  const { id } = await params

  try {
    const products = await readProducts()
    const index = productIndexById(products, id)
    if (index === -1) return NextResponse.json({ error: "Product not found." }, { status: 404 })

    const referrers = products.filter(
      (product) =>
        product.id !== id &&
        Array.isArray(product.relatedProducts) &&
        product.relatedProducts.includes(id),
    )
    if (referrers.length > 0) {
      const ids = referrers.map((product) => product.id)
      return NextResponse.json(
        {
          error: `Cannot delete "${id}" because it is referenced by ${ids.length} related product(s): ${ids.join(", ")}. Remove those references first.`,
          referrers: ids,
        },
        { status: 409 },
      )
    }

    await deleteProduct(id)

    return NextResponse.json({ ok: true, removed: id })
  } catch (error) {
    const message =
      error instanceof ProductStoreError ? error.message : "Unable to delete the product."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
