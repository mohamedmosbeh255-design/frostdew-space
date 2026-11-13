import { NextResponse } from "next/server"
import { guardWrite } from "@/lib/admin/api-guard"
import {
  buildMediaPath,
  createMediaUploadTicket,
  declaredMediaInfo,
  isUploadKind,
  normalizeUploadName,
  normalizeUploadSize,
  sizeLimitForKind,
  sizeLimitForType,
} from "@/lib/media-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const noStore = { "Cache-Control": "no-store" }

const megabytes = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`

/**
 * Step 1 of the upload flow: validate the request and issue a short-lived
 * signed storage token. The file itself goes directly from the browser to
 * Supabase Storage, so Vercel's request-body limit never applies.
 */
export async function POST(request: Request) {
  const denied = await guardWrite(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON upload request." },
      { status: 400, headers: noStore },
    )
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Expected a JSON upload request." },
      { status: 400, headers: noStore },
    )
  }

  const payload = body as Record<string, unknown>
  const kind = typeof payload.kind === "string" ? payload.kind.trim() : ""

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { error: 'Choose an upload kind: "hero", "poster", or "product".' },
      { status: 400, headers: noStore },
    )
  }

  const name = normalizeUploadName(payload.name)
  if (!name) {
    return NextResponse.json(
      { error: "Choose a non-empty file to upload." },
      { status: 400, headers: noStore },
    )
  }

  const declaredSize = normalizeUploadSize(payload.size)
  if (!declaredSize) {
    return NextResponse.json(
      { error: "The upload size is missing or invalid." },
      { status: 400, headers: noStore },
    )
  }

  const declaredMime = typeof payload.mime === "string" ? payload.mime : ""
  const declared = declaredMediaInfo(declaredMime, name)

  if (!declared) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Use JPEG, PNG, WebP, AVIF, GIF, MP4, or WebM.",
      },
      { status: 415, headers: noStore },
    )
  }

  if (kind !== "hero" && declared.type !== "image") {
    return NextResponse.json(
      { error: "This field accepts images only." },
      { status: 415, headers: noStore },
    )
  }

  const limit = Math.min(sizeLimitForKind(kind), sizeLimitForType(declared.type))
  if (declaredSize > limit) {
    return NextResponse.json(
      {
        error: `File is too large. The limit is ${megabytes(limit)} for this field.`,
      },
      { status: 413, headers: noStore },
    )
  }

  // The extension is chosen server-side from the canonical MIME mapping.
  const path = buildMediaPath(kind, declared.extension)

  let ticket: Awaited<ReturnType<typeof createMediaUploadTicket>>
  try {
    ticket = await createMediaUploadTicket(path)
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to start the upload. Check that the Supabase Storage bucket exists and the service key is configured.",
      },
      { status: 500, headers: noStore },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      bucket: ticket.bucket,
      path: ticket.path,
      token: ticket.token,
      publicUrl: ticket.publicUrl,
      type: declared.type,
      mime: declared.mime,
      name,
    },
    { status: 201, headers: noStore },
  )
}
