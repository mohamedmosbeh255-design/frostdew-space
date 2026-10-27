import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { guardWrite } from "@/lib/admin/api-guard"
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media-source.mjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")
const KINDS = ["hero", "poster", "product"] as const

type UploadKind = (typeof KINDS)[number]
type MediaType = "image" | "video"

type MediaInfo = {
  type: MediaType
  extension: string
  mime: string
}

const isUploadKind = (value: string): value is UploadKind =>
  (KINDS as readonly string[]).includes(value)

const startsWith = (buffer: Buffer, bytes: number[]): boolean =>
  buffer.length >= bytes.length &&
  bytes.every((byte, index) => buffer[index] === byte)

const ascii = (buffer: Buffer, start: number, end: number): string =>
  buffer.subarray(start, end).toString("ascii")

/**
 * Detects the real file type from its bytes. Browser-supplied MIME types are
 * useful hints but are never trusted for the stored file.
 */
function detectMedia(buffer: Buffer): MediaInfo | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { type: "image", extension: "jpg", mime: "image/jpeg" }
  }

  if (
    startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { type: "image", extension: "png", mime: "image/png" }
  }

  if (buffer.length >= 6 && ascii(buffer, 0, 6).startsWith("GIF8")) {
    return { type: "image", extension: "gif", mime: "image/gif" }
  }

  if (
    buffer.length >= 12 &&
    ascii(buffer, 0, 4) === "RIFF" &&
    ascii(buffer, 8, 12) === "WEBP"
  ) {
    return { type: "image", extension: "webp", mime: "image/webp" }
  }

  if (buffer.length >= 12 && ascii(buffer, 4, 8) === "ftyp") {
    const brand = ascii(buffer, 8, 12)

    if (brand === "avif" || brand === "avis") {
      return { type: "image", extension: "avif", mime: "image/avif" }
    }

    if (
      ["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "mmp4", "dash"].includes(
        brand,
      )
    ) {
      return { type: "video", extension: "mp4", mime: "video/mp4" }
    }
  }

  if (
    startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])
  ) {
    return { type: "video", extension: "webm", mime: "video/webm" }
  }

  return null
}

const megabytes = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`

export async function POST(request: Request) {
  const denied = await guardWrite(request)
  if (denied) return denied

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart/form-data upload." },
      { status: 400 },
    )
  }

  const file = formData.get("file")
  const kindValue = formData.get("kind")
  const kind = typeof kindValue === "string" ? kindValue.trim() : ""

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { error: 'Choose an upload kind: "hero", "poster", or "product".' },
      { status: 400 },
    )
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a non-empty file to upload." }, { status: 400 })
  }

  const earlyLimit = kind === "hero" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > earlyLimit) {
    return NextResponse.json(
      { error: `File is too large. The limit is ${megabytes(earlyLimit)} for this field.` },
      { status: 413 },
    )
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: "Unable to read the uploaded file." }, { status: 400 })
  }

  const media = detectMedia(buffer)
  if (!media) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF, GIF, MP4, or WebM." },
      { status: 415 },
    )
  }

  if (kind !== "hero" && media.type !== "image") {
    return NextResponse.json(
      { error: "This field accepts images only." },
      { status: 415 },
    )
  }

  const sizeLimit = media.type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > sizeLimit) {
    return NextResponse.json(
      { error: `File is too large. ${media.type === "video" ? "Videos" : "Images"} are limited to ${megabytes(sizeLimit)}.` },
      { status: 413 },
    )
  }

  const folder = kind === "product" ? "products" : "hero"
  const prefix = kind === "poster" ? "poster-" : ""
  const filename = `${prefix}${randomUUID()}.${media.extension}`
  const directory = path.join(UPLOAD_ROOT, folder)
  const destination = path.join(directory, filename)

  try {
    await mkdir(directory, { recursive: true })
    // `wx` makes an accidental collision fail instead of overwriting a file.
    await writeFile(destination, buffer, { flag: "wx" })
  } catch {
    return NextResponse.json(
      { error: "Unable to save the uploaded file. Check that public/uploads is writable." },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      url: `/uploads/${folder}/${filename}`,
      type: media.type,
      mime: media.mime,
      size: file.size,
      name: file.name,
    },
    { status: 201 },
  )
}
