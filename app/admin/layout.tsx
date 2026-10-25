import type { Metadata } from "next"
import { notFound } from "next/navigation"
import AdminLogin from "@/components/admin/admin-login"
import AdminLogout from "@/components/admin/admin-logout"
import {
  adminFeatureEnabled,
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin/auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin · FrostDew",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Production is locked down unless ADMIN_ENABLED=true.
  if (!adminFeatureEnabled()) notFound()

  const configured = isAdminConfigured()
  const authenticated = await isAdminAuthenticated()

  return (
    <div className="min-h-screen bg-ice/40">
      <header className="border-b border-border bg-snow">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
              FrostDew admin
            </p>
            <p className="font-display text-xl text-midnight">Product management</p>
          </div>
          {authenticated && <AdminLogout />}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <p
          role="note"
          className="rounded-xl border border-amber-cta/50 bg-amber-cta/10 px-4 py-3 text-xs leading-relaxed text-midnight"
        >
          <strong>Development / prototype.</strong> Changes are written straight to{" "}
          <code className="rounded bg-white/70 px-1">data/products.json</code> on this machine.
          There is no database, audit log, or multi-user access control here. Production should
          connect to a real backend — see <code className="rounded bg-white/70 px-1">docs/admin.md</code>.
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        {!configured ? (
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6">
            <h1 className="font-display text-2xl text-midnight">Admin is not configured</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a password to <code className="rounded bg-muted px-1">.env.local</code> and restart
              the dev server:
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
  )
}
