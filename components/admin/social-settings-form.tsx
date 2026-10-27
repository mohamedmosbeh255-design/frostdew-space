"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  SOCIAL_META,
  SOCIAL_PLATFORMS,
  validateSocialLinks,
  type SocialLinkErrors,
  type SocialLinks,
} from "@/lib/social-links"

type Message = { tone: "error" | "success"; text: string }

export default function SocialSettingsForm({ initialLinks }: { initialLinks: SocialLinks }) {
  const router = useRouter()
  const [values, setValues] = useState<SocialLinks>(initialLinks)
  const [errors, setErrors] = useState<SocialLinkErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [pending, setPending] = useState(false)

  const update = (platform: keyof SocialLinks, value: string) => {
    setValues((current) => ({ ...current, [platform]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[platform]
      delete next.form
      return next
    })
    setMessage(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage(null)

    const { links, errors: clientErrors } = validateSocialLinks(values)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setMessage({ tone: "error", text: "Please fix the highlighted fields." })
      return
    }

    setPending(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ socialLinks: links }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        errors?: SocialLinkErrors
        settings?: { socialLinks: SocialLinks }
      }

      if (!response.ok) {
        setErrors(data.errors ?? {})
        setMessage({ tone: "error", text: data.error ?? "Could not save site settings." })
        return
      }

      if (data.settings) setValues(data.settings.socialLinks)
      setMessage({ tone: "success", text: "Settings saved — changes are live." })
      router.refresh()
    } catch {
      setMessage({ tone: "error", text: "Network error while saving site settings." })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {message && (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "error"
              ? "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {message.text}
          {message.tone === "error" && errors.form && (
            <p className="mt-1 text-xs">{errors.form}</p>
          )}
        </div>
      )}

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Footer links</legend>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Leave a field blank to hide that icon in the footer. URLs must start with{" "}
          <code className="rounded bg-white/70 px-1">https://</code> and point at the matching
          platform.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const meta = SOCIAL_META[platform]
            const id = `social-${platform}`
            const error = errors[platform]
            const hidden = values[platform].trim() === ""

            return (
              <div key={platform} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={id}
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {meta.label}
                  </label>
                  <span
                    className={
                      hidden
                        ? "rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground"
                        : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-800"
                    }
                  >
                    {hidden ? "Hidden" : "Visible"}
                  </span>
                </div>
                <input
                  id={id}
                  name={platform}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={300}
                  value={values[platform]}
                  placeholder={meta.placeholder}
                  onChange={(event) => update(platform, event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
                />
                {error ? (
                  <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {error}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Allowed: {meta.hostHint}</p>
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-5 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
        >
          View site ↗
        </Link>
        <p className="text-xs text-muted-foreground">
          Saved changes appear in the footer on the next page load.
        </p>
      </div>
    </form>
  )
}
