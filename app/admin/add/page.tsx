import ProductForm from "@/components/admin/product-form"
import { isAdminAuthenticated } from "@/lib/admin/auth"
import { readProducts } from "@/lib/admin/products-store"

export const dynamic = "force-dynamic"

export default async function AddProductPage() {
  if (!(await isAdminAuthenticated())) return null

  const products = await readProducts()
  const productOptions = products.map(({ id, brand, name }) => ({ id, brand, name }))

  return <ProductForm mode="create" productOptions={productOptions} />
}
