import type { Metadata } from "next"
import { ListChecks, ScanSearch, ShieldCheck, Sparkles } from "lucide-react"
import PageShell from "@/components/page-shell"
import AnalyzerForm from "./analyzer-form"

export const metadata: Metadata = {
  title: "Ingredient Analyzer",
  description:
    "Paste any INCI ingredient list and see every ingredient broken out in label order. A free, browser-based FrostDew tool.",
  alternates: { canonical: "/analyzer" },
  openGraph: {
    type: "website",
    title: "Ingredient Analyzer | FrostDew",
    description:
      "Paste a product label and the FrostDew Ingredient Analyzer separates and counts every ingredient in the list.",
    url: "/analyzer",
    siteName: "FrostDew",
    images: [{ url: "/hero/hero-poster.jpg", alt: "FrostDew ingredient analyzer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ingredient Analyzer | FrostDew",
    description:
      "Paste any INCI list and see every ingredient broken out in label order.",
    images: ["/hero/hero-poster.jpg"],
  },
}

const CHIPS = [
  { icon: ListChecks, label: "Paste any INCI list" },
  { icon: ScanSearch, label: "Every ingredient, in order" },
  { icon: ShieldCheck, label: "Nothing stored" },
]

export default function AnalyzerPage() {
  return (
    <PageShell>
      <section className="relative isolate overflow-hidden bg-midnight">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Skincare Lab
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            Ingredient
            <span className="block text-cyan-300">Analyzer.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ice/70 sm:text-lg">
            Paste any product label and we&apos;ll decode every ingredient. Start with the INCI
            list — the tool separates it, numbers it, and shows exactly what is in the formula.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {CHIPS.map((chip) => {
              const Icon = chip.icon
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ice/75 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  {chip.label}
                </span>
              )
            })}
          </div>

          <AnalyzerForm />

          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-ice/40">
            Educational only — not a diagnosis or a substitute for a dermatologist. This first
            version reads the list; it does not yet explain what each ingredient does.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
