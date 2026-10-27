import { isAdminAuthenticated } from "@/lib/admin/auth"
import { readSiteSettings } from "@/lib/site-settings"
import ContentSettingsForm from "@/components/admin/content-settings-form"
import PartnerSettingsForm from "@/components/admin/partner-settings-form"
import SocialSettingsForm from "@/components/admin/social-settings-form"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  // Defence in depth: never serialise settings for an unauthenticated request.
  if (!(await isAdminAuthenticated())) return null

  const { socialLinks, content, partners } = await readSiteSettings()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-midnight">Site settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage public copy, social links, and partner stores stored in{" "}
          <code className="rounded bg-white/70 px-1">site_settings</code> and{" "}
          <code className="rounded bg-white/70 px-1">partners</code>. Saving one section leaves
          the others untouched.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl text-midnight">Content manager</h2>
          <p className="text-sm text-muted-foreground">
            Homepage hero seasons and media, About page, footer tagline, and Contact page
            copy.
          </p>
        </div>
        <ContentSettingsForm initialContent={content} />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div>
          <h2 className="font-display text-xl text-midnight">Social media</h2>
          <p className="text-sm text-muted-foreground">
            Footer icons. Leave a field blank to hide that platform.
          </p>
        </div>
        <SocialSettingsForm initialLinks={socialLinks} />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div>
          <h2 className="font-display text-xl text-midnight">Partner Links</h2>
          <p className="text-sm text-muted-foreground">
            External store links shown in the footer Partners column.
          </p>
        </div>
        <PartnerSettingsForm initialPartners={partners} />
      </section>
    </div>
  )
}
