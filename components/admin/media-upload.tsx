"use client"

import { useEffect, useRef, useState } from "react"
import { Upload } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  HERO_MEDIA_ACCEPT,
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaTypeFromSource,
} from "@/lib/media-source.mjs"

export type UploadKind = "hero" | "poster" | "product"

export type UploadedMedia = {
  url: string
  type: "image" | "video"
  mime: string
  size: number
  name?: string
}

const megabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

const acceptFor = (kind: UploadKind): string =>
  kind === "hero" ? HERO_MEDIA_ACCEPT : IMAGE_ACCEPT

function inferredType(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("image/")) return "image"
  return mediaTypeFromSource(file.name)
}

let browserClient: SupabaseClient | null = null

/**
 * Lazily creates the browser Supabase client so the SDK is not part of the
 * initial admin bundle. It uses the publishable/anon key, which is already
 * public; the signed upload token (not the key) authorizes the write.
 */
async function getBrowserClient(): Promise<SupabaseClient> {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim()

  if (!url || !key) {
    throw new Error("Supabase is not configured in this environment.")
  }

  const { createClient } = await import("@supabase/supabase-js")
  browserClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return browserClient
}

export default function MediaUploadButton({
  kind,
  label = "Upload",
  disabled = false,
  onUploaded,
}: {
  kind: UploadKind
  label?: string
  disabled?: boolean
  onUploaded: (media: UploadedMedia) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 4000)
    return () => window.clearTimeout(timer)
  }, [status])

  async function upload(file: File) {
    setError(null)
    setStatus(null)

    if (file.size === 0) {
      setError("Choose a non-empty file.")
      return
    }

    const type = inferredType(file)
    if (kind !== "hero" && type !== "image") {
      setError("This field accepts images only.")
      return
    }

    const limit = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > limit) {
      setError(
        `${type === "video" ? "Videos" : "Images"} are limited to ${megabytes(limit)}.`,
      )
      return
    }

    setPending(true)
    setStage("Requesting upload…")
    try {
      const ticketResponse = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: file.name,
          mime: file.type,
          size: file.size,
        }),
      })

      const ticket = (await ticketResponse.json().catch(() => ({}))) as {
        error?: string
        bucket?: string
        path?: string
        token?: string
        mime?: string
      }

      if (!ticketResponse.ok) {
        setError(ticket.error ?? "Upload failed.")
        return
      }

      if (
        typeof ticket.bucket !== "string" ||
        typeof ticket.path !== "string" ||
        typeof ticket.token !== "string" ||
        typeof ticket.mime !== "string"
      ) {
        setError("The upload response was invalid.")
        return
      }

      const client = await getBrowserClient()
      setStage("Uploading…")

      const { error: uploadError } = await client.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: ticket.mime,
          cacheControl: "31536000",
        })

      if (uploadError) {
        setError(uploadError.message || "Upload failed.")
        return
      }

      setStage("Verifying…")
      const confirmResponse = await fetch("/api/admin/uploads/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          path: ticket.path,
          name: file.name,
          mime: ticket.mime,
          size: file.size,
        }),
      })

      const data = (await confirmResponse.json().catch(() => ({}))) as {
        error?: string
        url?: string
        type?: "image" | "video"
        mime?: string
        size?: number
        name?: string
      }

      if (!confirmResponse.ok) {
        setError(data.error ?? "Upload verification failed.")
        return
      }

      if (
        typeof data.url !== "string" ||
        (data.type !== "image" && data.type !== "video")
      ) {
        setError("The upload response was invalid.")
        return
      }

      onUploaded({
        url: data.url,
        type: data.type,
        mime: typeof data.mime === "string" ? data.mime : file.type,
        size: typeof data.size === "number" ? data.size : file.size,
        name: typeof data.name === "string" ? data.name : file.name,
      })
      setStatus("Uploaded. Save the form to publish.")
    } catch (uploadError) {
      setError(
        uploadError instanceof Error && uploadError.message
          ? uploadError.message
          : "Network error while uploading.",
      )
    } finally {
      setStage(null)
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={acceptFor(kind)}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset immediately so choosing the same file again still fires.
          event.target.value = ""
          if (file) void upload(file)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {pending ? (stage ?? "Uploading…") : label}
      </button>
      {error && (
        <p role="alert" className="max-w-56 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="max-w-56 text-xs text-emerald-800">
          {status}
        </p>
      )}
    </div>
  )
}

export function MediaPreview({
  src,
  type = "image",
  poster = "",
  alt = "",
  className = "",
}: {
  src: string
  type?: "image" | "video"
  poster?: string
  alt?: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    setPosterFailed(false)
  }, [src, poster, type])

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-ice px-2 text-center text-[0.65rem] font-medium text-muted-foreground ${className}`}
      >
        No media yet
      </div>
    )
  }

  if (failed) {
    if (poster && !posterFailed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className={className}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setPosterFailed(true)}
        />
      )
    }
    return (
      <div
        className={`flex items-center justify-center bg-ice px-2 text-center text-[0.65rem] font-medium text-muted-foreground ${className}`}
      >
        Preview unavailable
      </div>
    )
  }

  if (type === "video") {
    return (
      <video
        key={src}
        src={src}
        poster={poster || undefined}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
