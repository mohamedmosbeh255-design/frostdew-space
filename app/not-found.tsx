import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import PageShell from "@/components/page-shell"

export default function NotFound() {
  return (
    <PageShell>
      <div className="relative isolate flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ice/70 blur-3xl"
        />
        <span className="glass-chip rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-winter">
          404
        </span>
        <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-midnight sm:text-5xl">
          This page drifted away
        </h1>
        <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
          The page you were looking for is not here. It may have moved, or the link may be
          incomplete. The collection is still waiting.
        </p>
        <Link
          href="/#shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-cta px-6 py-3 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the shop
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-winter underline underline-offset-2">
            Contact us
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
