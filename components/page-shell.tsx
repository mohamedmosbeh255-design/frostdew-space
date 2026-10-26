import SiteFooter from "./site-footer"
import SiteHeader from "./site-header"

/** Public subpage chrome: solid header, padded main, and the site-wide footer. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader solid />
      <main className="pt-16">{children}</main>
      <SiteFooter />
    </>
  )
}
