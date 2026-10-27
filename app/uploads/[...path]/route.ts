import { readFile } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads")

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
}

type RouteContext = { params: Promise<{ path: string[] }> }

/**
 * `next start` builds its public-file map at boot, so a file uploaded while the
 * server is running would otherwise 404 until restart. This route reads files
 * from public/uploads on demand. Static files that existed at build time are
 * still served directly by Next.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { path: parts } = await params
  const segments = Array.isArray(parts) ? parts : []

  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        segment.includes("/"),
    )
  ) {
    return new Response("Not found", { status: 404 })
  }

  const filePath = path.resolve(UPLOAD_ROOT, ...segments)
  if (!filePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    return new Response("Not found", { status: 404 })
  }

  const extension = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[extension]
  if (!contentType) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const data = await readFile(filePath)
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "content-length": String(data.byteLength),
        // Uploaded names are random UUIDs, so a URL's bytes never change.
        "cache-control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
