import { NextResponse } from "next/server"
import { guardWrite } from "@/lib/admin/api-guard"
import {
  isUploadKind,
  normalizeUploadName,
  normalizeUploadSize,
  removeMediaObject,
  verifyMediaUpload,
} from "@/lib/media-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const noStore = { "Cache-Control": "no-store" }

/**
 * Step 3 of the upload flow: verify the object the browser wrote directly to
 * Supabase Storage and return the response shape the admin forms already use.
 */
export async function POST(request: Request) {
  const denied = await guardWrite(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON upload confirmation." },
      { status: 400, headers: noStore },
    )
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Expected a JSON upload confirmation." },
      { status: 400, headers: noStore },
    )
  }

  const payload = body as Record<string, unknown>
  const kind = typeof payload.kind === "string" ? payload.kind.trim() : ""
  const path = typeof payload.path === "string" ? payload.path.trim() : ""

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { error: 'Choose an upload kind: "hero", "poster", or "product".' },
      { status: 400, headers: noStore },
    )
  }

  if (!path) {
    return NextResponse.json(
      { error: "The uploaded path is missing." },
      { status: 400, headers: noStore },
    )
  }

  const name = normalizeUploadName(payload.name) ?? "upload"
  const size = normalizeUploadSize(payload.size) ?? 0
  const mime = typeof payload.mime === "string" ? payload.mime : ""

  let result: Awaited<ReturnType<typeof verifyMediaUpload>>
  try {
    result = await verifyMediaUpload({ kind, path, mime, size })
  } catch {
    return NextResponse.json(
      { error: "Unable to verify the uploaded file." },
      { status: 500, headers: noStore },
    )
  }

  if (!result.ok) {
    if (result.cleanup) {
      await removeMediaObject(path)
    }
    return NextResponse.json(
      { error: result.error },
      { status: result.status, headers: noStore },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      url: result.url,
      type: result.media.type,
      mime: result.media.mime,
      size: result.size,
      name,
    },
    { status: 201, headers: noStore },
  )
}
