"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NAV_LINKS } from "@/lib/site"

export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isSolid = solid || pathname !== "/" || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/about"
                ? pathname === "/about"
                : link.href === "/contact"
                  ? pathname === "/contact"
                  : pathname === "/"
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-500 sm:px-4 ${
                  isSolid ? "text-winter hover:bg-ice" : "text-white hover:bg-white/15"
                } ${active && isSolid ? "bg-ice" : ""}`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
