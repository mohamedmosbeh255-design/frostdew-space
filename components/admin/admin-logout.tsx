"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogout() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  )
}
