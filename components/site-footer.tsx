export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-12 text-center">
        <a href="#home" className="font-display text-xl font-medium tracking-[0.25em] text-midnight">
          FROSTDEW
        </a>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          As an Amazon Associate (Amazon US, Amazon UK) and a Stylevana affiliate partner, FrostDew
          earns a commission from qualifying purchases. Prices and availability can change at any
          time, so please check the store for the current price.
        </p>
        <p className="text-xs text-muted-foreground">© 2026 FrostDew. All rights reserved.</p>
      </div>
    </footer>
  )
}
