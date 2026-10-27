import Link from "next/link"
import { connection } from "next/server"
import { ArrowUpRight, Snowflake } from "lucide-react"
import { AMAZON_ASSOCIATE_DISCLOSURE, LEGAL_LINKS } from "@/lib/site"
import { SOCIAL_META, SOCIAL_PLATFORMS } from "@/lib/social-links"
import { readSiteSettings } from "@/lib/site-settings"
import SocialIcon from "./social-icon"

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-winter focus-visible:text-winter"

export default async function SiteFooter() {
  const year = new Date().getFullYear()

  // Opt into request-time rendering so admin settings edits appear immediately
  // instead of being frozen into the build output.
  await connection()
  const { socialLinks, content, partners } = await readSiteSettings()
  const visibleSocials = SOCIAL_PLATFORMS.filter(
    (platform) => socialLinks[platform] !== "",
  ).map((platform) => ({
    platform,
    label: SOCIAL_META[platform].label,
    href: socialLinks[platform],
  }))
  const gridColumns =
    partners.length > 0
      ? "lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]"
      : "lg:grid-cols-[1.5fr_1fr_1fr_1fr]"

  return (
    <footer className="border-t border-border bg-white/60">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className={`grid gap-10 sm:grid-cols-2 ${gridColumns}`}>
          <div>
            <Link
              href="/#home"
              className="font-display text-xl font-medium tracking-[0.25em] text-midnight"
            >
              FROSTDEW
            </Link>
            <p className="mt-3 font-display text-lg italic text-winter">
              {content.footer.tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              An independent edit of Korean skincare for cold weather, dry air, and the glow that
              gets you through winter.
            </p>
          </div>

          <nav aria-label="Shop">
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">Shop</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/#shop" className={linkClass}>
                  All products
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
              Company
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {partners.length > 0 && (
            <nav aria-label="Partners">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
                Partners
              </h2>
              <ul className="mt-4 flex flex-col items-start gap-2.5">
                {partners.map((partner, index) => (
                  <li key={`${partner.url}-${index}`}>
                    <a
                      href={partner.url}
                      target={partner.newTab ? "_blank" : undefined}
                      rel={partner.newTab ? "noopener noreferrer" : undefined}
                      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-glacier/30 bg-white/75 px-3.5 py-1.5 text-xs font-semibold text-winter shadow-[0_2px_10px_rgba(23,45,67,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-glacier/60 hover:bg-ice/80 hover:text-midnight hover:shadow-[0_8px_20px_rgba(93,143,179,0.2)] focus-visible:border-glacier/60 focus-visible:bg-ice/80 focus-visible:text-midnight focus-visible:shadow-[0_8px_20px_rgba(93,143,179,0.2)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <span className="min-w-0 truncate">{partner.name}</span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 text-glacier transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-cta motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                        aria-hidden="true"
                      />
                      {partner.newTab && (
                        <span className="sr-only"> (opens in a new tab)</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label="Legal">
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
              Legal
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Social row: between the link columns and the disclosure/copyright line */}
        {visibleSocials.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-8">
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-glacier">
              <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
              Follow FrostDew
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-2.5">
              {visibleSocials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`FrostDew on ${social.label}`}
                    title={social.label}
                    className="glass-chip flex h-10 w-10 items-center justify-center rounded-full text-winter transition-all duration-300 hover:-translate-y-0.5 hover:text-midnight hover:shadow-md focus-visible:outline-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <SocialIcon platform={social.platform} className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={
            visibleSocials.length > 0
              ? "mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {AMAZON_ASSOCIATE_DISCLOSURE}
          </p>
          <p className="text-xs text-muted-foreground">
            © {year} FrostDew. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
