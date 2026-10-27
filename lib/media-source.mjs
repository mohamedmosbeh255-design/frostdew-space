/**
 * Shared, dependency-free helpers for validating image/video sources.
 *
 * Used by the TypeScript hero settings, the product validator, and client form
 * components. Keep this file browser-safe: no Node imports.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.gif"
export const VIDEO_ACCEPT = "video/mp4,video/webm,.mp4,.webm"
export const HERO_MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`

const MAX_SOURCE_LENGTH = 500
const LOCAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*$/
const VIDEO_PATH_PATTERN = /\.(?:mp4|webm)$/i

/** @param {unknown} value */
const trimmedString = (value) => (typeof value === "string" ? value.trim() : "")

/**
 * A root-relative public path such as `/uploads/products/abc.jpg`.
 * Rejects protocol-relative paths, traversal, backslashes, and spaces.
 *
 * @param {unknown} value
 */
export function isSafeLocalPath(value) {
  const path = trimmedString(value)
  if (!path || path.length > MAX_SOURCE_LENGTH) return false
  if (!path.startsWith("/") || path.startsWith("//")) return false
  if (path.includes("\\")) return false
  if (!LOCAL_PATH_PATTERN.test(path)) return false

  return !path.split("/").some((segment) => segment === "." || segment === "..")
}

/**
 * Accepts an https URL or a safe root-relative public path.
 *
 * @param {unknown} value
 */
export function isValidMediaSource(value) {
  const source = trimmedString(value)
  if (!source || source.length > MAX_SOURCE_LENGTH) return false
  if (isSafeLocalPath(source)) return true

  try {
    const url = new URL(source)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}

/**
 * Stable key for duplicate detection. Returns null for unsupported sources.
 *
 * @param {unknown} value
 */
export function mediaSourceKey(value) {
  const source = trimmedString(value)
  if (!source) return null
  if (isSafeLocalPath(source)) return `local:${source}`

  try {
    const url = new URL(source)
    if (url.protocol !== "https:" || url.username || url.password) return null
    return `url:${url.href}`
  } catch {
    return null
  }
}

/**
 * Best-effort type detection for manually pasted URLs. Uploads use actual
 * file-content detection on the server instead.
 *
 * @param {unknown} value
 * @returns {"image" | "video"}
 */
export function mediaTypeFromSource(value) {
  const source = trimmedString(value)
  if (!source) return "image"

  let pathname = source
  try {
    pathname = new URL(source, "http://local.invalid").pathname
  } catch {
    // Keep the raw value and fall through to the extension check.
  }

  return VIDEO_PATH_PATTERN.test(pathname) ? "video" : "image"
}
