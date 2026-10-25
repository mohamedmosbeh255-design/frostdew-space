"use client"

import { useEffect, useState } from "react"

export default function SiteHeader() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        solid
          ? "border-b border-border bg-snow/85 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a
          href="#home"
          className={`font-display text-lg font-medium tracking-[0.22em] transition-colors duration-500 ${
            solid ? "text-midnight" : "text-white"
          }`}
        >
          FROSTDEW
        </a>
        <nav aria-label="Primary">
          <a
            href="#shop"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-500 ${
              solid ? "text-winter hover:bg-ice" : "text-white hover:bg-white/15"
            }`}
          >
            Shop
          </a>
        </nav>
      </div>
    </header>
  )
}
