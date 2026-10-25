"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Sign in failed.")
        return
      }

      setPassword("")
      router.refresh()
    } catch {
      setError("Network error. Is the dev server running?")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="font-display text-2xl text-midnight">Admin sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the password from <code className="rounded bg-muted px-1">ADMIN_PASSWORD</code> in
        <code className="rounded bg-muted px-1">.env.local</code>.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="admin-password"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "admin-login-error" : undefined}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
          />
        </div>

        {error && (
          <p id="admin-login-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-4 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
