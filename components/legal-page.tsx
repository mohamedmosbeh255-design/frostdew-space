export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-ice/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-frost/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-glacier">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-midnight sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-winter">{intro}</p>}
        {updated && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Last updated: {updated}
          </p>
        )}

        <div className="legal-prose mt-10 rounded-3xl border border-border bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
