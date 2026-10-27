import { connection } from "next/server"
import Hero from "@/components/hero"
import Shop from "@/components/shop"
import SiteFooter from "@/components/site-footer"
import SiteHeader from "@/components/site-header"
import Snowfall from "@/components/snowfall"
import { readProducts } from "@/lib/admin/products-store"
import { readSiteSettings } from "@/lib/site-settings"

export default async function Page() {
  // Read content and products per request so admin edits appear without a rebuild.
  await connection()
  const [{ content }, products] = await Promise.all([
    readSiteSettings(),
    readProducts(),
  ])

  return (
    <>
      <SiteHeader />
      <Snowfall />
      <main>
        <Hero content={content.hero} />
        <Shop products={products} />
      </main>
      <SiteFooter />
    </>
  )
}
