"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/admin", label: "Products", match: /^\/admin(\/(add|edit)(\/|$)|$)/ },
  { href: "/admin/settings", label: "Site settings", match: /^\/admin\/settings(\/|$)/ },
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => {
        const active = item.match.test(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-midnight px-4 py-2 text-xs font-semibold text-snow"
                : "rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
