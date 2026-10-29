"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, PlusCircle, Settings2 } from "lucide-react"

const ITEMS = [
  { href: "/admin", label: "Products", icon: Package, match: /^\/admin(\/(edit)(\/|$)|$)/ },
  { href: "/admin/add", label: "Add product", icon: PlusCircle, match: /^\/admin\/add(\/|$)/ },
  { href: "/admin/settings", label: "Site settings", icon: Settings2, match: /^\/admin\/settings(\/|$)/ },
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {ITEMS.map((item) => {
        const active = item.match.test(pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex shrink-0 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-winter to-midnight px-4 py-2.5 text-sm font-bold text-snow shadow-lg shadow-winter/25"
                : "flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-winter transition-colors hover:bg-white/80"
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
