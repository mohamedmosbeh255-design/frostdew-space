import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import LegalPage from "@/components/legal-page"
import PageShell from "@/components/page-shell"
import { readSiteSettings } from "@/lib/site-settings"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn who is behind FrostDew, how we curate Korean skincare, and how we choose the products we recommend.",
}

export default async function AboutPage() {
  await connection()
  const { content } = await readSiteSettings()

  return (
    <PageShell>
      <LegalPage
        eyebrow={content.about.eyebrow}
        title={content.about.title}
        intro={content.about.intro}
      >
        <p>
          We are not a brand, a clinic, or a marketplace. We are a small editorial site that
          researches K-beauty, compares what is actually available, and points you to a trusted
          retailer when a product looks worth trying.
        </p>

        {/* PLACEHOLDER: Replace this origin paragraph with the real founding story. */}
        <p>
          FrostDew began with a simple winter problem: the routines that worked in summer stopped
          being enough once the air turned dry and the heating came on. Instead of chasing every
          new launch, we started keeping a short list of barrier-friendly cleansers, layered
          hydrators, and sunscreens that made the season easier.
        </p>

        <h2>What we do</h2>
        <ul>
          <li>Curate a focused catalogue of Korean skincare rather than an endless feed.</li>
          <li>Explain what each product is for, who it suits, and how it fits a routine.</li>
          <li>Check that every listing points to a real, currently available store page.</li>
          <li>Link out to the retailer so you can buy directly, at the same price you would pay anyway.</li>
        </ul>
        <p>
          We do not manufacture, ship, or fulfil orders. Every purchase happens on the
          retailer&apos;s site, and their terms, shipping, and returns policy apply.
        </p>

        <h2>How we choose products</h2>
        <p>
          We start with the job a product is meant to do, then look at whether the formula,
          texture, and price make sense for that job. Our shortlist usually comes down to:
        </p>
        <ul>
          <li>
            <strong>Formulation fit.</strong> Ingredients and texture that match the concern,
            without unnecessary irritation for the intended user.
          </li>
          <li>
            <strong>Brand track record.</strong> Consistent quality, clear labelling, and a
            history of reformulating responsibly.
          </li>
          <li>
            <strong>Real-world feedback.</strong> Repeated praise and criticism from a range of
            skin types, not a single viral post.
          </li>
          <li>
            <strong>Availability and value.</strong> A reliable store page and a price that makes
            sense for what you get.
          </li>
          <li>
            <strong>Winter suitability.</strong> Barrier support, layered hydration, and
            sun protection that still feels comfortable in cold weather.
          </li>
        </ul>

        {/* PLACEHOLDER: Confirm the editorial policy wording before publishing. */}
        <p>
          Inclusion is editorial, not paid placement. Brands cannot buy a spot in the catalogue or
          a better position on the page. Some links are affiliate links, which is how the site
          stays free to read; commissions never change the price you pay. See our{" "}
          <Link href="/affiliate-disclosure">affiliate disclosure</Link> for the full detail.
        </p>

        <h2>Why winter</h2>
        <p>
          Cold wind, low humidity, and constant indoor heat can leave skin tight, flushed, or
          suddenly reactive. A good winter routine is less about adding more steps and more about
          supporting the barrier, holding onto water, and protecting against daylight that is
          still there even when the sky is grey.
        </p>
        <p>
          We still include products for every season. Winter is simply the lens we use when we
          decide what deserves a place on the shelf.
        </p>

        <h2>Corrections and questions</h2>
        <p>
          Prices move, formulas change, and links break. If you spot something wrong, tell us and
          we will fix it. Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </LegalPage>
    </PageShell>
  )
}
