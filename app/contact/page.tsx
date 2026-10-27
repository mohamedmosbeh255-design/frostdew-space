import type { Metadata } from "next"
import { connection } from "next/server"
import ContactForm from "@/components/contact-form"
import PageShell from "@/components/page-shell"
import { readSiteSettings } from "@/lib/site-settings"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact FrostDew with product questions, corrections, or partnership enquiries. Email hellofrostdew@gmail.com.",
}

export default async function ContactPage() {
  await connection()
  const { content } = await readSiteSettings()

  return (
    <PageShell>
      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-ice/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-frost/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-glacier">Say Hello</p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-midnight sm:text-5xl">
            Contact FrostDew
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-winter">
            {content.contact.intro}
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-6 rounded-3xl border border-border bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">
                  Email us
                </h2>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-block break-all font-display text-xl text-winter underline decoration-frost underline-offset-4 transition-colors hover:text-midnight"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">
                  Response time
                </h2>
                {/* Response-time commitment is editable in Site settings. */}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {content.contact.responseTime}
                </p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">
                  A quick note
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We can help with catalogue questions, corrections, and link issues. We cannot
                  give medical advice or diagnose skin conditions — please speak to a qualified
                  clinician for that.
                </p>
              </div>

              <div className="mt-auto rounded-2xl border border-border bg-snow/80 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Prefer your own mail app? Write to{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-winter underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  directly.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-8">
              <h2 className="font-display text-2xl font-medium text-midnight">Send a message</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Fill this in and we will open a prefilled email in your mail app. No account and no
                server-side form.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
