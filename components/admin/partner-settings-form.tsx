"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import {
  MAX_PARTNERS,
  validatePartners,
  type PartnerErrors,
  type PartnerLink,
} from "@/lib/partners"

type Message = { tone: "error" | "success"; text: string }

type Draft = PartnerLink & { key: string }

const toDrafts = (partners: PartnerLink[]): Draft[] =>
  partners.map((partner, index) => ({
    ...partner,
    key: `saved-${index}-${partner.url}`,
  }))

const newKey = () => `partner-${Date.now()}-${Math.random().toString(36).slice(2)}`

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  maxLength: number
  type?: "text" | "url"
  placeholder?: string
}

function PartnerField({
  id,
  label,
  value,
  onChange,
  error,
  maxLength,
  type = "text",
  placeholder,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label} <span aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={type === "url" ? "url" : undefined}
        autoComplete="off"
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default function PartnerSettingsForm({
  initialPartners,
}: {
  initialPartners: PartnerLink[]
}) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>(() => toDrafts(initialPartners))
  const [errors, setErrors] = useState<PartnerErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [pending, setPending] = useState(false)

  const clearFieldError = (index: number, field: keyof PartnerLink) => {
    setErrors((current) => {
      const next = { ...current }
      delete next[`partners.${index}.${field}`]
      delete next.form
      return next
    })
    setMessage(null)
  }

  const update = (index: number, patch: Partial<PartnerLink>) => {
    setDrafts((current) =>
      current.map((draft, position) =>
        position === index ? { ...draft, ...patch } : draft,
      ),
    )
    for (const field of Object.keys(patch) as (keyof PartnerLink)[]) {
      clearFieldError(index, field)
    }
  }

  const addPartner = () => {
    if (drafts.length >= MAX_PARTNERS) return
    setDrafts((current) => [
      ...current,
      { key: newKey(), name: "", url: "", newTab: true },
    ])
    setErrors({})
    setMessage(null)
  }

  const removePartner = (index: number) => {
    setDrafts((current) => current.filter((_, position) => position !== index))
    setErrors({})
    setMessage(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage(null)

    const payload = drafts.map((draft) => ({
      name: draft.name,
      url: draft.url,
      newTab: draft.newTab,
    }))
    const { partners: normalized, errors: clientErrors } = validatePartners(payload)

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
        body: JSON.stringify({ partners: normalized }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        errors?: PartnerErrors
        settings?: { partners: PartnerLink[] }
      }

      if (!response.ok) {
        setErrors(data.errors ?? {})
        setMessage({ tone: "error", text: data.error ?? "Could not save partner links." })
        return
      }

      setDrafts(toDrafts(data.settings?.partners ?? normalized))
      setMessage({ tone: "success", text: "Partners saved — changes are live." })
      router.refresh()
    } catch {
      setMessage({ tone: "error", text: "Network error while saving partner links." })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

      <p className="text-xs leading-relaxed text-muted-foreground">
        Store links appear in the footer in this order. The entire column is hidden when the list
        is empty.
      </p>

      {drafts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white/60 px-4 py-6 text-center text-sm text-muted-foreground">
          No partners yet. The footer Partners column is hidden.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map((draft, index) => {
            const newTabError = errors[`partners.${index}.newTab`]
            const nameId = `partners-${index}-name`
            const urlId = `partners-${index}-url`

            return (
              <div
                key={draft.key}
                className="rounded-xl border border-border bg-white/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
                    Partner {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removePartner(index)}
                    className="text-xs font-semibold text-destructive underline-offset-2 transition-colors hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <PartnerField
                    id={nameId}
                    label="Name"
                    value={draft.name}
                    onChange={(value) => update(index, { name: value })}
                    error={errors[`partners.${index}.name`]}
                    maxLength={80}
                    placeholder="BeautyNest Korea"
                  />
                  <PartnerField
                    id={urlId}
                    label="URL"
                    type="url"
                    value={draft.url}
                    onChange={(value) => update(index, { url: value })}
                    error={errors[`partners.${index}.url`]}
                    maxLength={300}
                    placeholder="https://example.com/"
                  />
                </div>

                <div className="mt-3 flex flex-col gap-1">
                  <label
                    htmlFor={`partners-${index}-new-tab`}
                    className="flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    <input
                      id={`partners-${index}-new-tab`}
                      name={`partners-${index}-new-tab`}
                      type="checkbox"
                      checked={draft.newTab}
                      onChange={(event) =>
                        update(index, { newTab: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-border accent-winter"
                    />
                    Open in new tab
                  </label>
                  {newTabError && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {newTabError}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={addPartner}
          disabled={drafts.length >= MAX_PARTNERS}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add partner
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          {drafts.length} of {MAX_PARTNERS} partner slots used.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-5 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save partners"}
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
          Changes are not saved until you click Save partners.
        </p>
      </div>
    </form>
  )
}
