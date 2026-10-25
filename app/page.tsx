import Hero from "@/components/hero"
import Shop from "@/components/shop"
import SiteFooter from "@/components/site-footer"
import SiteHeader from "@/components/site-header"
import Snowfall from "@/components/snowfall"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <Snowfall />
      <main>
        <Hero />
        <Shop />
      </main>
      <SiteFooter />
    </>
  )
}
