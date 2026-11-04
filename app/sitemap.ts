import type { MetadataRoute } from "next"
import { connection } from "next/server"
import { readCatalog } from "@/lib/product-catalog"
import { SITE_URL } from "@/lib/site"

const ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/routine-decoder", changeFrequency: "monthly", priority: 0.7 },
  { path: "/analyzer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/affiliate-disclosure", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Products are edited in Supabase at runtime, so build the sitemap per request.
  await connection()
  const products = await readCatalog()
  const lastModified = new Date()

  // Encode and deduplicate ids so a malformed or repeated catalog row can
  // never produce a broken or duplicate product URL in the sitemap.
  const productUrls = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const product of products) {
    const id = product.id.trim()
    if (!id) continue
    const url = `${SITE_URL}/products/${encodeURIComponent(id)}`
    productUrls.set(url, {
      url,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  }

  return [
    ...ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...productUrls.values(),
  ]
}
