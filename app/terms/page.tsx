import type { Metadata } from "next"
import Link from "next/link"
import LegalPage from "@/components/legal-page"
import PageShell from "@/components/page-shell"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that apply when you use FrostDew, including informational content, external links, warranties, and governing law.",
}

export default function TermsPage() {
  return (
    <PageShell>
      <LegalPage
        eyebrow="Legal"
        title="Terms of Use"
        updated="October 26, 2026"
        intro="These terms apply when you browse FrostDew. By using the site, you agree to them."
      >
        <h2>What FrostDew is</h2>
        <p>
          FrostDew is an informational catalogue of Korean skincare. We describe products, compare
          options, and link to third-party retailers. We are not a retailer, manufacturer, or
          fulfilment service, and we do not sell products directly.
        </p>
        <p>
          Nothing on this site is medical advice. If you have a skin condition, an allergy, or a
          concern about a product, speak to a qualified clinician before using it.
        </p>

        <h2>Product information and pricing</h2>
        <p>
          We try to keep names, descriptions, ingredients, images, and prices accurate, but we
          cannot guarantee that everything is current or complete. Retailers control pricing,
          stock, promotions, and shipping, and they can change them at any time.
        </p>
        <p>
          Always confirm the current price, ingredients, and availability on the retailer&apos;s
          page before buying. A listing on FrostDew is not an offer to sell, and it is not a
          promise that a product is in stock.
        </p>

        <h2>No warranties</h2>
        <p>
          The site is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the
          fullest extent permitted by law, FrostDew makes no warranties of any kind, express or
          implied, including warranties of merchantability, fitness for a particular purpose,
          accuracy, or non-infringement.
        </p>
        <p>
          We do not warrant that the site will be uninterrupted, error-free, or free of harmful
          components, or that any information on it is complete or up to date.
        </p>

        <h2>External links</h2>
        <p>
          FrostDew links to websites we do not control, including Amazon US, Amazon UK, Stylevana,
          and other resources. We are not responsible for their content, products, pricing,
          security, or privacy practices. Following an external link is at your own risk, and the
          destination&apos;s terms and policies apply.
        </p>

        <h2>Affiliate links</h2>
        <p>
          Some outbound links are affiliate links. If you buy through them, we may earn a commission
          at no extra cost to you. See our{" "}
          <Link href="/affiliate-disclosure">affiliate disclosure</Link> for details.
        </p>

        <h2>Intellectual property</h2>
        <p>
          The FrostDew name, site design, and original written content belong to FrostDew. Product
          names, brand names, logos, and images belong to their respective owners and are used for
          identification and editorial purposes. You may link to our pages, but you may not copy
          substantial portions of the site and present them as your own.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Please do not attempt to disrupt the site, scrape it at a rate that affects other
          visitors, introduce malicious code, or use it for unlawful purposes. We may restrict
          access if these terms are abused.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, FrostDew will not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the
          site, from a purchase made on a third-party site, or from reliance on any information
          published here.
        </p>

        <h2>Governing law</h2>
        {/* PLACEHOLDER: Replace with the confirmed jurisdiction before publishing. */}
        <p>
          These terms are governed by the laws of{" "}
          <strong>[Governing jurisdiction — to be confirmed]</strong>, without regard to conflict
          of law principles. Any dispute will be handled by the courts of that jurisdiction.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. The revised version will appear on this page
          with a new date. Continuing to use the site after a change means you accept the updated
          terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalPage>
    </PageShell>
  )
}
