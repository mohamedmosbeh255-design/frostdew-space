/**
 * File-signature detection shared by the upload ticket and confirm routes.
 *
 * Browser-supplied MIME types are useful hints but are never trusted for the
 * stored file. This module is dependency-free and browser-safe: it only reads
 * bytes, so it can be imported from either runtime.
 */

export type MediaType = "image" | "video"

export type MediaInfo = {
  type: MediaType
  extension: string
  mime: string
}

/** MIME types the storage bucket accepts, in the same order as the docs. */
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
] as const

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
}

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
}

export const isAllowedMediaMime = (mime: string): boolean =>
  mime in MIME_TO_EXTENSION

export const extensionForMime = (mime: string): string | null =>
  MIME_TO_EXTENSION[mime] ?? null

export const mimeForExtension = (extension: string): string | null =>
  EXTENSION_TO_MIME[extension.toLowerCase()] ?? null

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  bytes.length >= signature.length &&
  signature.every((byte, index) => bytes[index] === byte)

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  new TextDecoder("latin1").decode(bytes.subarray(start, end))

/**
 * Detects the real media type from its first bytes. Returns null when the
 * signature is not one of the accepted formats.
 */
export function detectMedia(bytes: Uint8Array): MediaInfo | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { type: "image", extension: "jpg", mime: "image/jpeg" }
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { type: "image", extension: "png", mime: "image/png" }
  }

  if (bytes.length >= 6 && ascii(bytes, 0, 6).startsWith("GIF8")) {
    return { type: "image", extension: "gif", mime: "image/gif" }
  }

  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return { type: "image", extension: "webp", mime: "image/webp" }
  }

  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12)

    if (brand === "avif" || brand === "avis") {
      return { type: "image", extension: "avif", mime: "image/avif" }
    }

    if (
      [
        "isom",
        "iso2",
        "iso4",
        "iso5",
        "iso6",
        "mp41",
        "mp42",
        "avc1",
        "M4V ",
        "mmp4",
        "dash",
      ].includes(brand)
    ) {
      return { type: "video", extension: "mp4", mime: "video/mp4" }
    }
  }

  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { type: "video", extension: "webm", mime: "video/webm" }
  }

  return null
}
