import type { Metadata } from "next"
import Link from "next/link"
import LegalPage from "@/components/legal-page"
import PageShell from "@/components/page-shell"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FrostDew handles privacy: no accounts, no site-collected personal data, Vercel Analytics, cookies, and affiliate links.",
}

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <LegalPage
        eyebrow="Privacy"
        title="Privacy Policy"
        updated="October 26, 2026"
        intro="FrostDew is a catalogue and editorial site. There are no accounts, no checkout, and no newsletter sign-up."
      >
        <h2>Information we collect</h2>
        <p>
          We do not ask you to create an account, and we do not collect names, addresses, payment
          details, or saved preferences on this site. There is no checkout here: purchases happen
          on the retailer&apos;s website, under that retailer&apos;s privacy policy.
        </p>
        <p>
          If you email us, we receive whatever you choose to include in that message — typically
          your name, email address, and the content of your note. We use it only to reply and to
          fix the issue you raised.
        </p>

        <h2>Analytics</h2>
        <p>
          In production, FrostDew uses{" "}
          <a href="https://vercel.com/docs/analytics" target="_blank" rel="noopener noreferrer">
            Vercel Analytics
          </a>{" "}
          to understand aggregate traffic — for example, which pages are visited and which
          products are viewed. Vercel Analytics is designed to be privacy-friendly: it does not use
          cookies and does not build advertising profiles or track you across other sites.
        </p>
        <p>
          Our hosting provider may also process standard server logs (such as IP address, browser
          type, and requested URL) for security and reliability. These logs are not used by
          FrostDew to identify individual visitors.
        </p>

        <h2>Cookies</h2>
        <p>
          FrostDew does not set its own advertising or analytics cookies, and we do not run
          third-party ad trackers. That is why you will not see a cookie consent banner here.
        </p>
        <p>
          When you click through to a retailer, that retailer may set cookies or similar
          technologies on its own site — including cookies used to attribute an affiliate
          referral. Those cookies are controlled by the retailer, not by FrostDew, and are covered
          by the retailer&apos;s cookie and privacy notices. You can block or clear them in your
          browser settings.
        </p>

        <h2>Affiliate links</h2>
        <p>
          Store links may include a referral parameter so the retailer knows the visit came from
          FrostDew. If you buy something, we may earn a commission at no extra cost to you. See our{" "}
          <Link href="/affiliate-disclosure">affiliate disclosure</Link> for the full explanation.
        </p>

        <h2>Third parties</h2>
        <ul>
          <li>
            <strong>Vercel</strong> — hosting and aggregate analytics.
          </li>
          <li>
            <strong>Retailers</strong> — Amazon US, Amazon UK, and Stylevana handle the purchase,
            payment, shipping, and returns on their own sites.
          </li>
          <li>
            <strong>Email</strong> — messages you send to us are handled by our email provider.
          </li>
        </ul>
        <p>
          We do not sell personal information, and we do not share it for cross-context behavioural
          advertising.
        </p>

        <h2>Your choices</h2>
        <p>
          You can browse FrostDew without submitting any personal information. You can block or
          delete cookies in your browser, use a private window, or use tracking-protection
          features. If you have emailed us and would like your message deleted, contact us and we
          will remove it unless we are required to keep it.
        </p>

        <h2>Children</h2>
        <p>
          FrostDew is not directed at children under 13, and we do not knowingly collect personal
          information from them.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If our practices change, we will update this page and revise the date at the top. Material
          changes will be reflected here before they take effect.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalPage>
    </PageShell>
  )
}
