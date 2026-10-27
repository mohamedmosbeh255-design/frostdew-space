/** Central site constants shared by pages, metadata, footer, and disclosures. */

export const SITE_NAME = "FrostDew"
export const CONTACT_EMAIL = "hellofrostdew@gmail.com"

/** Absolute site URL, without a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
)

/** Required Amazon Associates sentence, kept verbatim in one place. */
export const AMAZON_ASSOCIATE_DISCLOSURE =
  "As an Amazon Associate I earn from qualifying purchases."

/** FTC proximity disclosure shown above the grid and beside store buttons. */
export const AFFILIATE_PROXIMITY_NOTE =
  "We may earn a commission from purchases made through these links, at no extra cost to you."

export const NAV_LINKS = [
  { href: "/#shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const

export const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
] as const

// Social links and partner stores are user-managed at runtime in
// Supabase, editable from /admin/settings.
