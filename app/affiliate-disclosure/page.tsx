import type { Metadata } from "next"
import Link from "next/link"
import LegalPage from "@/components/legal-page"
import PageShell from "@/components/page-shell"
import { AMAZON_ASSOCIATE_DISCLOSURE, AFFILIATE_PROXIMITY_NOTE, CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How FrostDew uses affiliate links with Amazon US, Amazon UK, and Stylevana through Awin — and why commissions never increase your price.",
}

export default function AffiliateDisclosurePage() {
  return (
    <PageShell>
      <LegalPage
        eyebrow="Transparency"
        title="Affiliate Disclosure"
        updated="October 26, 2026"
        intro="FrostDew is reader-supported. Some links on this site are affiliate links, which means we may earn a commission if you buy through them."
      >
        <div className="rounded-2xl border border-frost/70 bg-ice/60 p-5">
          <p className="font-semibold text-midnight">{AMAZON_ASSOCIATE_DISCLOSURE}</p>
        </div>

        <p>
          That sentence is required by Amazon, but it is not the whole picture. The same principle
          applies to every retailer we work with: if you use one of our links, we may be paid a
          small commission. It costs you nothing extra.
        </p>

        <h2>How affiliate links work</h2>
        <p>
          When you click a store button, the link carries a referral code that tells the retailer
          the visit came from FrostDew. If you buy something during that visit — or within the
          retailer&apos;s attribution window — the retailer pays us a percentage of the sale.
        </p>
        <p>
          You pay the same price you would have paid by going to the store directly. The commission
          comes out of the retailer&apos;s margin, never out of your pocket.
        </p>

        <h2>Stores we work with</h2>
        <ul>
          <li>
            <strong>Amazon US</strong> — through the Amazon Associates programme. Qualifying
            purchases earn a commission.
          </li>
          <li>
            <strong>Amazon UK</strong> — through the Amazon Associates UK programme. Qualifying
            purchases earn a commission.
          </li>
          <li>
            <strong>Stylevana</strong> — through the Awin affiliate network. Qualifying purchases
            earn a commission.
          </li>
        </ul>
        <p>
          We only link to retailers we would be comfortable buying from ourselves. A retailer
          paying a commission does not guarantee a product a place in the catalogue.
        </p>

        <h2>Prices and availability change</h2>
        <p>
          Prices, discounts, coupons, and stock are controlled by the retailer and can change at
          any time — sometimes within hours. The price shown on FrostDew is a snapshot, not a live
          quote, and it may be out of date.
        </p>
        <p>
          Always check the current price and availability on the retailer&apos;s page before you
          buy. Every store button on this site carries the reminder:{" "}
          <em>Price and availability may change. Please verify on the store.</em>
        </p>

        <h2>How we label affiliate links</h2>
        <p>
          Links that may earn us a commission open in a new tab and use{" "}
          <code>rel=&quot;sponsored&quot;</code>. We also show a short disclosure above the product
          grid and again inside each product dialog, next to the store buttons:
        </p>
        <p className="rounded-xl border border-border bg-snow/80 px-4 py-3 text-sm font-medium text-winter">
          {AFFILIATE_PROXIMITY_NOTE}
        </p>

        <h2>Editorial independence</h2>
        {/* PLACEHOLDER: Confirm this editorial policy statement. */}
        <p>
          Commission rates do not decide what we include or how we describe it. We choose products
          for the reasons set out on our <Link href="/about">about page</Link>, and we will happily
          recommend a product with no affiliate link when it is the right answer. If a listing is
          ever sponsored in a different way, we will label it clearly.
        </p>

        <h2>Questions</h2>
        <p>
          If anything here is unclear, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also read our{" "}
          <Link href="/privacy-policy">privacy policy</Link> for how links and analytics affect
          your data.
        </p>
      </LegalPage>
    </PageShell>
  )
}
