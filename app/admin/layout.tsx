import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, Snowflake } from "lucide-react"
import AdminLogin from "@/components/admin/admin-login"
import AdminLogout from "@/components/admin/admin-logout"
import AdminNav from "@/components/admin/admin-nav"
import {
  adminFeatureEnabled,
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin/auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Keeper's Cabin · FrostDew Admin",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Production is locked down unless ADMIN_ENABLED=true.
  if (!adminFeatureEnabled()) notFound()

  const configured = isAdminConfigured()
  const authenticated = await isAdminAuthenticated()

  return (
    <div className="min-h-screen bg-gradient-to-b from-ice/70 via-snow to-ice/50">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-winter to-midnight text-snow shadow-lg shadow-winter/25">
              <Snowflake className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="font-display text-lg leading-tight tracking-[0.16em] text-midnight">
                FrostDew
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-glacier">
                Keeper&rsquo;s Cabin
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3.5 py-2 text-sm font-bold text-winter transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            {authenticated && <AdminLogout />}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {authenticated && (
          <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
            <div className="rounded-3xl border border-white/70 bg-white/65 p-3 shadow-lg shadow-winter/5 backdrop-blur-xl">
              <AdminNav />
            </div>
            <p className="mt-4 px-4 text-[0.62rem] leading-relaxed text-muted-foreground">
              Changes are written straight to Supabase. Public reads are RLS-limited; writes use
              the server-only service-role key.
            </p>
          </aside>
        )}

        <main className="min-w-0 flex-1">
          {authenticated && (
            <div className="mb-4 lg:hidden">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur-xl">
                <AdminNav />
              </div>
            </div>
          )}

          {!configured ? (
            <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6">
              <h1 className="font-display text-2xl text-midnight">Admin is not configured</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a password to <code className="rounded bg-muted px-1">.env.local</code> and
                restart the dev server:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-midnight p-3 text-xs text-snow">
                ADMIN_PASSWORD=your-local-password{"\n"}
                ADMIN_SESSION_SECRET=some-long-random-value
              </pre>
            </div>
          ) : authenticated ? (
            children
          ) : (
            <AdminLogin />
          )}
        </main>
      </div>
    </div>
  )
}
