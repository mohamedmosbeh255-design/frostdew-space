import "server-only"

import { randomUUID } from "node:crypto"
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media-source.mjs"
import { getSupabaseAdminClient } from "@/lib/supabase"
import {
  detectMedia,
  extensionForMime,
  isAllowedMediaMime,
  mimeForExtension,
  type MediaInfo,
  type MediaType,
} from "@/lib/media-detect"

/**
 * Server-only helpers for the Supabase Storage upload flow.
 *
 * The browser never receives the service-role key. It uploads with a
 * short-lived, single-path signed token issued here, then the confirm route
 * verifies the stored object's size and magic bytes before the URL is saved.
 */

export type UploadKind = "hero" | "poster" | "product"

export const UPLOAD_KINDS = ["hero", "poster", "product"] as const

export const isUploadKind = (value: string): value is UploadKind =>
  (UPLOAD_KINDS as readonly string[]).includes(value)

/** Bucket name is configurable but defaults to `media` for parity with the docs. */
export const MEDIA_BUCKET =
  process.env.SUPABASE_MEDIA_BUCKET?.trim() || "media"

const MAX_NAME_LENGTH = 255
const MAX_SIGNATURE_BYTES = 64

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
const EXTENSION_PATTERN = "(?:jpg|png|gif|webp|avif|mp4|webm)"
const PATH_PATTERNS: Record<UploadKind, RegExp> = {
  product: new RegExp(`^products/${UUID_PATTERN}\\.${EXTENSION_PATTERN}$`, "i"),
  hero: new RegExp(`^hero/${UUID_PATTERN}\\.${EXTENSION_PATTERN}$`, "i"),
  poster: new RegExp(`^hero/poster-${UUID_PATTERN}\\.${EXTENSION_PATTERN}$`, "i"),
}

/** Maximum bytes allowed for a kind, independent of the detected media type. */
export function sizeLimitForKind(kind: UploadKind): number {
  return kind === "hero" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
}

/** Maximum bytes allowed for a detected media type. */
export function sizeLimitForType(type: MediaType): number {
  return type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
}

export function isMediaPathForKind(path: string, kind: UploadKind): boolean {
  return PATH_PATTERNS[kind].test(path)
}

/**
 * Builds an immutable object path. The extension comes from the server-side
 * canonical MIME mapping, never from the uploaded filename.
 */
export function buildMediaPath(kind: UploadKind, extension: string): string {
  const folder = kind === "product" ? "products" : "hero"
  const prefix = kind === "poster" ? "poster-" : ""
  return `${folder}/${prefix}${randomUUID()}.${extension}`
}

/** Resolves the declared MIME/extension to a canonical pair, or null. */
export function declaredMediaInfo(
  mime: string,
  name: string,
): { mime: string; extension: string; type: MediaType } | null {
  const normalized = mime.trim().toLowerCase()

  if (isAllowedMediaMime(normalized)) {
    const extension = extensionForMime(normalized)
    if (extension) {
      return {
        mime: normalized,
        extension,
        type: normalized.startsWith("video/") ? "video" : "image",
      }
    }
  }

  const extension = name.split(".").pop()?.trim().toLowerCase() ?? ""
  const derived = mimeForExtension(extension)
  if (derived) {
    return {
      mime: derived,
      extension,
      type: derived.startsWith("video/") ? "video" : "image",
    }
  }

  return null
}

export function normalizeUploadName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const name = value.trim()
  if (!name || name.length > MAX_NAME_LENGTH) return null
  return name
}

export function normalizeUploadSize(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const size = Math.round(value)
  return size > 0 ? size : null
}

export function publicMediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local and to Vercel.",
    )
  }

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${encodedPath}`
}

export type MediaUploadTicket = {
  bucket: string
  path: string
  token: string
  publicUrl: string
}

/** Issues a short-lived signed upload token scoped to one exact object path. */
export async function createMediaUploadTicket(
  path: string,
): Promise<MediaUploadTicket> {
  const { data, error } = await getSupabaseAdminClient()
    .storage.from(MEDIA_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data?.token) {
    throw new Error(error?.message || "Storage did not return an upload token.")
  }

  return {
    bucket: MEDIA_BUCKET,
    path: data.path,
    token: data.token,
    publicUrl: publicMediaUrl(data.path),
  }
}

export async function removeMediaObject(path: string): Promise<void> {
  try {
    await getSupabaseAdminClient().storage.from(MEDIA_BUCKET).remove([path])
  } catch {
    // Cleanup is best-effort; never mask the original verification error.
  }
}

type StoredObject = {
  size: number
  mimetype: string
}

async function statMediaObject(path: string): Promise<StoredObject | null> {
  const slash = path.lastIndexOf("/")
  const folder = path.slice(0, slash)
  const filename = path.slice(slash + 1)

  const { data, error } = await getSupabaseAdminClient()
    .storage.from(MEDIA_BUCKET)
    .list(folder, { limit: 100, search: filename })

  if (error || !data) return null

  const match = data.find((entry) => entry.name === filename)
  if (!match?.metadata) return null

  const size = Number(match.metadata.size)
  return {
    size: Number.isFinite(size) ? size : 0,
    mimetype: (match.metadata.mimetype ?? "").toLowerCase(),
  }
}

async function readSignature(publicUrl: string): Promise<Uint8Array | null> {
  let response: Response
  try {
    response = await fetch(publicUrl, {
      headers: { Range: `bytes=0-${MAX_SIGNATURE_BYTES - 1}` },
      cache: "no-store",
    })
  } catch {
    return null
  }

  if (!response.ok || !response.body) return null

  // Some storage providers ignore Range and return 200 with the full file.
  // Read only the first bytes in that case and cancel the rest of the stream.
  if (response.status === 200) {
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0

    try {
      while (total < MAX_SIGNATURE_BYTES) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        const remaining = MAX_SIGNATURE_BYTES - total
        const slice = value.subarray(0, remaining)
        chunks.push(slice)
        total += slice.length
        if (slice.length < value.length) break
      }
    } finally {
      await reader.cancel().catch(() => {})
    }

    const signature = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      signature.set(chunk, offset)
      offset += chunk.length
    }
    return signature
  }

  try {
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

export type VerifyFailure = {
  ok: false
  status: number
  error: string
  cleanup: boolean
}

export type VerifySuccess = {
  ok: true
  url: string
  media: MediaInfo
  size: number
}

export type VerifyResult = VerifyFailure | VerifySuccess

const megabytes = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`

/**
 * Confirms the object exists, matches the declared path, and contains bytes
 * that match an accepted media signature. On failure the caller may delete the
 * object (`cleanup: true`) so a rejected upload cannot linger publicly.
 */
export async function verifyMediaUpload(input: {
  kind: UploadKind
  path: string
  mime: string
  size: number
}): Promise<VerifyResult> {
  const { kind, path, mime, size } = input

  if (!isMediaPathForKind(path, kind)) {
    return {
      ok: false,
      status: 400,
      error: "The uploaded path does not match this field.",
      cleanup: false,
    }
  }

  let stat: StoredObject | null
  try {
    stat = await statMediaObject(path)
  } catch {
    stat = null
  }

  if (!stat) {
    return {
      ok: false,
      status: 400,
      error: "The uploaded file was not found in storage.",
      cleanup: false,
    }
  }

  if (stat.mimetype && !isAllowedMediaMime(stat.mimetype)) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF, GIF, MP4, or WebM.",
      cleanup: true,
    }
  }

  const signature = await readSignature(publicMediaUrl(path))
  const detected = signature ? detectMedia(signature) : null

  if (!detected) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF, GIF, MP4, or WebM.",
      cleanup: true,
    }
  }

  if (kind !== "hero" && detected.type !== "image") {
    return {
      ok: false,
      status: 415,
      error: "This field accepts images only.",
      cleanup: true,
    }
  }

  if (stat.mimetype && stat.mimetype !== detected.mime) {
    return {
      ok: false,
      status: 415,
      error: "The file contents do not match the declared type.",
      cleanup: true,
    }
  }

  const expected = declaredMediaInfo(mime, path)
  if (expected && expected.type !== detected.type) {
    return {
      ok: false,
      status: 415,
      error: "The file contents do not match the declared type.",
      cleanup: true,
    }
  }

  const typeLimit = sizeLimitForType(detected.type)
  const kindLimit = sizeLimitForKind(kind)
  const limit = Math.min(typeLimit, kindLimit)
  const actualSize = stat.size > 0 ? stat.size : size

  if (actualSize > limit) {
    return {
      ok: false,
      status: 413,
      error: `File is too large. The limit is ${megabytes(limit)} for this field.`,
      cleanup: true,
    }
  }

  return {
    ok: true,
    url: publicMediaUrl(path),
    media: detected,
    size: actualSize,
  }
}
