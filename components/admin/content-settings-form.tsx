"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import {
  HERO_SEASONS,
  HERO_SEASON_HINTS,
  HERO_SEASON_LABELS,
  type HeroMediaField,
  type HeroSeason,
} from "@/lib/hero-media"
import {
  validateSiteContent,
  type ContentErrors,
  type ContentFieldPath,
  type SiteContent,
} from "@/lib/site-content"
import MediaUploadButton, {
  MediaPreview,
  type UploadedMedia,
} from "./media-upload"

type Message = { tone: "error" | "success"; text: string }

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  maxLength: number
  hint?: string
  multiline?: boolean
  rows?: number
}

function ContentField({
  id,
  label,
  value,
  onChange,
  error,
  maxLength,
  hint,
  multiline = false,
  rows = 4,
}: FieldProps) {
  const shared = {
    id,
    name: id,
    value,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className:
      "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label} <span aria-hidden="true">*</span>
      </label>
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type="text" />
      )}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function HeroMediaField({
  id,
  label,
  value,
  onChange,
  onUploaded,
  error,
  hint,
  kind,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onUploaded: (media: UploadedMedia) => void
  error?: string
  hint?: string
  kind: "hero" | "poster"
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          maxLength={500}
          autoComplete="off"
          spellCheck={false}
          placeholder={kind === "hero" ? "/uploads/hero/…" : "/uploads/hero/poster-…"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
        />
        <MediaUploadButton
          kind={kind}
          label={kind === "hero" ? "Upload media" : "Upload poster"}
          disabled={disabled}
          onUploaded={onUploaded}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export default function ContentSettingsForm({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter()
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [editingSeason, setEditingSeason] = useState<HeroSeason>(
    initialContent.hero.activeSeason,
  )
  const [errors, setErrors] = useState<ContentErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [pending, setPending] = useState(false)

  const update = <S extends keyof SiteContent, K extends keyof SiteContent[S]>(
    section: S,
    key: K,
    value: string,
  ) => {
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }))
    const path = `${section}.${String(key)}` as ContentFieldPath
    setErrors((current) => {
      const next = { ...current }
      delete next[path]
      delete next.form
      return next
    })
    setMessage(null)
  }

  const updateHeroMedia = (
    season: HeroSeason,
    field: HeroMediaField,
    value: string,
  ) => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        seasons: {
          ...current.hero.seasons,
          [season]: { ...current.hero.seasons[season], [field]: value },
        },
      },
    }))

    const key = `hero.seasons.${season}.${field}` as const
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      delete next["hero.activeSeason"]
      delete next.form
      return next
    })
    setMessage(null)
  }

  const setActiveSeason = (season: HeroSeason) => {
    setContent((current) => ({
      ...current,
      hero: { ...current.hero, activeSeason: season },
    }))
    setEditingSeason(season)
    setErrors((current) => {
      const next = { ...current }
      delete next["hero.activeSeason"]
      delete next.form
      return next
    })
    setMessage(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage(null)

    const { content: normalized, errors: clientErrors } = validateSiteContent(content)
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
        body: JSON.stringify({ content: normalized }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        errors?: ContentErrors
        settings?: { content: SiteContent }
      }

      if (!response.ok) {
        setErrors(data.errors ?? {})
        setMessage({ tone: "error", text: data.error ?? "Could not save content." })
        return
      }

      setContent(data.settings?.content ?? normalized)
      setMessage({ tone: "success", text: "Content saved — changes are live." })
      router.refresh()
    } catch {
      setMessage({ tone: "error", text: "Network error while saving content." })
    } finally {
      setPending(false)
    }
  }

  const media = content.hero.seasons[editingSeason]
  const editingIsLive = content.hero.activeSeason === editingSeason

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
        <legend className="px-1 text-sm font-bold text-midnight">Homepage hero</legend>

        <div className="mt-3 rounded-xl border border-border bg-white/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">
                Background media
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Save one background per season, then switch the live one without
                re-uploading. Live now:{" "}
                <strong className="text-midnight">
                  {HERO_SEASON_LABELS[content.hero.activeSeason]}
                </strong>
                .
              </p>
            </div>
          </div>

          {errors["hero.seasons"] && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {errors["hero.seasons"]}
            </p>
          )}
          {errors["hero.activeSeason"] && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {errors["hero.activeSeason"]}
            </p>
          )}

          <div
            role="tablist"
            aria-label="Hero season slots"
            className="mt-3 flex flex-wrap gap-2"
          >
            {HERO_SEASONS.map((season) => {
              const slot = content.hero.seasons[season]
              const selected = editingSeason === season
              const live = content.hero.activeSeason === season

              return (
                <button
                  key={season}
                  type="button"
                  role="tab"
                  id={`hero-season-tab-${season}`}
                  aria-selected={selected}
                  aria-controls={`hero-season-panel-${season}`}
                  onClick={() => setEditingSeason(season)}
                  className={
                    selected
                      ? "inline-flex items-center gap-1.5 rounded-full bg-winter px-3 py-2 text-xs font-semibold text-white"
                      : "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
                  }
                >
                  {HERO_SEASON_LABELS[season]}
                  {live && (
                    <span
                      className={
                        selected
                          ? "inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide"
                          : "inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-emerald-800"
                      }
                    >
                      <Check className="h-2.5 w-2.5" aria-hidden="true" />
                      Live
                    </span>
                  )}
                  {!slot.url && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-wide opacity-70">
                      Empty
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id={`hero-season-panel-${editingSeason}`}
            aria-labelledby={`hero-season-tab-${editingSeason}`}
            className="mt-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-midnight">
                  {HERO_SEASON_LABELS[editingSeason]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {HERO_SEASON_HINTS[editingSeason]}
                </p>
              </div>
              {editingIsLive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  This season is live
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSeason(editingSeason)}
                  disabled={!media.url}
                  className="inline-flex items-center justify-center rounded-full bg-amber-cta px-4 py-2 text-xs font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
                >
                  Use {HERO_SEASON_LABELS[editingSeason]} as live
                </button>
              )}
            </div>

            <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-border bg-ice">
              <MediaPreview
                src={media.url}
                type={media.type}
                poster={media.posterUrl}
                alt={`${HERO_SEASON_LABELS[editingSeason]} hero preview`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </span>
              <label className="flex items-center gap-2 text-sm text-midnight">
                <input
                  type="radio"
                  name={`hero-${editingSeason}-type`}
                  checked={media.type === "image"}
                  onChange={() => updateHeroMedia(editingSeason, "type", "image")}
                  className="h-4 w-4 accent-winter"
                />
                Image
              </label>
              <label className="flex items-center gap-2 text-sm text-midnight">
                <input
                  type="radio"
                  name={`hero-${editingSeason}-type`}
                  checked={media.type === "video"}
                  onChange={() => updateHeroMedia(editingSeason, "type", "video")}
                  className="h-4 w-4 accent-winter"
                />
                Video
              </label>
            </div>
            {errors[`hero.seasons.${editingSeason}.type`] && (
              <p role="alert" className="mt-1 text-xs font-medium text-destructive">
                {errors[`hero.seasons.${editingSeason}.type`]}
              </p>
            )}

            <div className="mt-3 grid gap-3">
              <HeroMediaField
                id={`hero-${editingSeason}-url`}
                label="Media URL"
                value={media.url}
                onChange={(value) => updateHeroMedia(editingSeason, "url", value)}
                onUploaded={(uploaded) => {
                  updateHeroMedia(editingSeason, "url", uploaded.url)
                  updateHeroMedia(editingSeason, "type", uploaded.type)
                }}
                error={errors[`hero.seasons.${editingSeason}.url`]}
                hint="Upload a file or paste an https:// URL or /uploads/... path. Images up to 8 MB; MP4/WebM video up to 25 MB."
                kind="hero"
                disabled={pending}
              />

              {media.type === "video" && (
                <HeroMediaField
                  id={`hero-${editingSeason}-poster`}
                  label="Poster image (optional)"
                  value={media.posterUrl}
                  onChange={(value) => updateHeroMedia(editingSeason, "posterUrl", value)}
                  onUploaded={(uploaded) =>
                    updateHeroMedia(editingSeason, "posterUrl", uploaded.url)
                  }
                  error={errors[`hero.seasons.${editingSeason}.posterUrl`]}
                  hint="Shown while the video loads, or if it cannot play."
                  kind="poster"
                  disabled={pending}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ContentField
            id="content-hero-eyebrow"
            label="Eyebrow"
            value={content.hero.eyebrow}
            onChange={(value) => update("hero", "eyebrow", value)}
            error={errors["hero.eyebrow"]}
            maxLength={40}
          />
          <ContentField
            id="content-hero-headline"
            label="Main headline"
            value={content.hero.headline}
            onChange={(value) => update("hero", "headline", value)}
            error={errors["hero.headline"]}
            maxLength={80}
          />
          <div className="sm:col-span-2">
            <ContentField
              id="content-hero-subheadline"
              label="Subheadline"
              value={content.hero.subheadline}
              onChange={(value) => update("hero", "subheadline", value)}
              error={errors["hero.subheadline"]}
              maxLength={160}
            />
          </div>
          <ContentField
            id="content-hero-cta-label"
            label="CTA button text"
            value={content.hero.ctaLabel}
            onChange={(value) => update("hero", "ctaLabel", value)}
            error={errors["hero.ctaLabel"]}
            maxLength={40}
          />
          <ContentField
            id="content-hero-cta-href"
            label="CTA link"
            value={content.hero.ctaHref}
            onChange={(value) => update("hero", "ctaHref", value)}
            error={errors["hero.ctaHref"]}
            maxLength={300}
            hint="Use #shop, /path, or an https:// URL."
          />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">About page</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ContentField
            id="content-about-eyebrow"
            label="Eyebrow"
            value={content.about.eyebrow}
            onChange={(value) => update("about", "eyebrow", value)}
            error={errors["about.eyebrow"]}
            maxLength={40}
          />
          <ContentField
            id="content-about-title"
            label="H1 title"
            value={content.about.title}
            onChange={(value) => update("about", "title", value)}
            error={errors["about.title"]}
            maxLength={120}
          />
          <div className="sm:col-span-2">
            <ContentField
              id="content-about-intro"
              label="Main description"
              value={content.about.intro}
              onChange={(value) => update("about", "intro", value)}
              error={errors["about.intro"]}
              maxLength={600}
              multiline
              rows={4}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Footer</legend>
        <div className="mt-3">
          <ContentField
            id="content-footer-tagline"
            label="Footer tagline"
            value={content.footer.tagline}
            onChange={(value) => update("footer", "tagline", value)}
            error={errors["footer.tagline"]}
            maxLength={160}
            hint="Shown under the FROSTDEW logo. Independent from the hero subheadline."
          />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Contact page</legend>
        <div className="mt-3 grid gap-4">
          <ContentField
            id="content-contact-intro"
            label="Intro text"
            value={content.contact.intro}
            onChange={(value) => update("contact", "intro", value)}
            error={errors["contact.intro"]}
            maxLength={600}
            multiline
            rows={3}
          />
          <ContentField
            id="content-contact-response-time"
            label="Response time note"
            value={content.contact.responseTime}
            onChange={(value) => update("contact", "responseTime", value)}
            error={errors["contact.responseTime"]}
            maxLength={600}
            multiline
            rows={3}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-5 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save content"}
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
          Uploads are saved immediately; click Save content to publish the new media.
        </p>
      </div>
    </form>
  )
}
