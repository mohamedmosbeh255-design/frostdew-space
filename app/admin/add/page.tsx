import ProductForm from "@/components/admin/product-form"
import { isAdminAuthenticated } from "@/lib/admin/auth"

export const dynamic = "force-dynamic"

export default async function AddProductPage() {
  if (!(await isAdminAuthenticated())) return null

  return <ProductForm mode="create" />
}
