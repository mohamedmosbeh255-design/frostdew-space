import Link from "next/link"
import {
  AMAZON_ASSOCIATE_DISCLOSURE,
  LEGAL_LINKS,
  SITE_TAGLINE,
} from "@/lib/site"

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-winter focus-visible:text-winter"

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-white/60">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/#home"
              className="font-display text-xl font-medium tracking-[0.25em] text-midnight"
            >
              FROSTDEW
            </Link>
            <p className="mt-3 font-display text-lg italic text-winter">{SITE_TAGLINE}</p>
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

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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
