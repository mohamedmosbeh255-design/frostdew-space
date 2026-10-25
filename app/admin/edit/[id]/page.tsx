import { notFound } from "next/navigation"
import ProductForm from "@/components/admin/product-form"
import { isAdminAuthenticated } from "@/lib/admin/auth"
import { readProducts } from "@/lib/admin/products-store"

export const dynamic = "force-dynamic"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return null

  const { id } = await params
  const products = await readProducts()
  const product = products.find((candidate) => candidate.id === id)

  if (!product) notFound()

  return <ProductForm mode="edit" initial={product} />
}
