"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import LanguageSelector from "@/components/language-selector"
import { usePreferences } from "@/lib/preferences"

const NAV_ITEMS = [
  { href: "/#shop", key: "shop" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const

export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = usePreferences()
  const isSolid = solid || pathname !== "/" || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === "/about"
      ? pathname === "/about"
      : href === "/contact"
        ? pathname === "/contact"
        : pathname === "/"

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-500 sm:px-4 ${
      isSolid ? "text-winter hover:bg-ice" : "text-white hover:bg-white/15"
    } ${active && isSolid ? "bg-ice" : ""}`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        isSolid
          ? "border-b border-border bg-snow/85 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/#home"
          className={`font-display text-lg font-medium tracking-[0.22em] transition-colors duration-500 ${
            isSolid ? "text-midnight" : "text-white"
          }`}
        >
          FROSTDEW
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label={t("nav.primary")} className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={chipClass(isActive(item.href))}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>

          <LanguageSelector solid={isSolid} />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 sm:hidden ${
              isSolid
                ? "border-border bg-white/80 text-winter hover:bg-ice focus-visible:ring-primary-500"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/70"
            }`}
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-2xl border border-border bg-snow/95 p-2 shadow-xl backdrop-blur-xl sm:hidden"
        >
          <nav aria-label={t("nav.primary")} className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-ice text-winter"
                    : "text-winter hover:bg-ice/70"
                }`}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
