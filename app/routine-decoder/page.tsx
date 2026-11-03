import type { Metadata } from "next"
import { connection } from "next/server"
import { FlaskConical, ListChecks, ScanSearch, ShieldCheck, Sparkles } from "lucide-react"
import PageShell from "@/components/page-shell"
import RoutineDecoder from "@/components/routine-decoder/RoutineDecoder"
import { readCatalog } from "@/lib/product-catalog"

export const metadata: Metadata = {
  title: "Routine Decoder",
  description:
    "Paste your skincare routine and get a 0–100 health score, order and ingredient checks, plus science-backed product matches from the FrostDew catalog.",
  alternates: { canonical: "/routine-decoder" },
  openGraph: {
    type: "website",
    title: "Routine Decoder | FrostDew",
    description:
      "A free interactive tool that checks application order, ingredient conflicts, pH layering and step load — then matches your routine to the catalog.",
    url: "/routine-decoder",
    siteName: "FrostDew",
    images: [{ url: "/hero/hero-poster.jpg", alt: "FrostDew routine decoder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Routine Decoder | FrostDew",
    description:
      "Check your routine's order, ingredient mix and pH, then find evidence-backed product matches.",
    images: ["/hero/hero-poster.jpg"],
  },
}

const HERO_CHIPS = [
  { icon: ListChecks, label: "Order & pH checks" },
  { icon: FlaskConical, label: "Ingredient conflicts" },
  { icon: ScanSearch, label: "Catalog matches" },
  { icon: ShieldCheck, label: "No data stored" },
]

export default async function RoutineDecoderPage() {
  // Products are edited at runtime, so read them per request. The catalog is
  // passed to the client component for local, no-upload matching.
  await connection()
  const products = await readCatalog()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden border-b border-border/70 bg-gradient-to-b from-snow via-white to-ice/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-ice/80 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-frost/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-ice/60 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.34em] text-secondary-600">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              FrostDew tool
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.08] text-midnight sm:text-5xl lg:text-6xl">
              Decode your routine.
              <span className="block text-glacier">Keep what works.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-winter sm:text-lg">
              Paste what you use — product names, INCI lists or both. The decoder checks the
              sequence, flags ingredient clashes, scores the routine out of 100, and matches the
              gaps to products we actually stock.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {HERO_CHIPS.map((chip) => {
                const Icon = chip.icon
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-glacier/25 bg-white/75 px-3 py-1.5 text-xs font-semibold text-winter shadow-sm backdrop-blur-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-glacier" aria-hidden="true" />
                    {chip.label}
                  </span>
                )
              })}
            </div>
            <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Educational only — not a diagnosis or a substitute for a dermatologist. Read the{" "}
              <a
                href="#routine-disclaimer-title"
                className="font-semibold text-winter underline decoration-glacier/50 underline-offset-2 hover:text-midnight"
              >
                full disclaimer
              </a>{" "}
              before changing prescription actives.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <RoutineDecoder products={products} today={today} />
      </div>
    </PageShell>
  )
}
