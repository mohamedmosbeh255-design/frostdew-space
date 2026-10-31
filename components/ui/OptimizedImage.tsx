"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  /** Classes for the frame: sizing, rounding, transitions. */
  className?: string
  /** Classes for the image itself: object-fit, padding, hover transforms. */
  imageClassName?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"]
  onLoadingComplete?: () => void
  onError?: () => void
}

const DEFAULT_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

/**
 * next/image wrapper with a loading skeleton.
 *
 * No custom loader is used on purpose. The catalog mixes Amazon, Olive Young,
 * and Supabase URLs, and `next.config.mjs` currently serves images unoptimized
 * (`images.unoptimized: true`). A loader that rewrites one host would leave the
 * others unchanged or, worse, append query parameters to signed/CDN URLs and
 * break them. If image optimization is enabled later, add the remote hosts to
 * `images.remotePatterns` instead of inventing a proxy hostname.
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  imageClassName = "h-full w-full object-cover",
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  referrerPolicy,
  onLoadingComplete,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const imageRef = useRef<HTMLImageElement>(null)
  const notifiedRef = useRef(false)
  const onCompleteRef = useRef(onLoadingComplete)
  onCompleteRef.current = onLoadingComplete

  const notifyLoaded = () => {
    if (notifiedRef.current) return
    notifiedRef.current = true
    onCompleteRef.current?.()
  }

  // A cached image can finish loading before hydration, in which case onLoad
  // never fires and the skeleton would stay forever. Check once on mount.
  useEffect(() => {
    if (!imageRef.current?.complete) return
    setIsLoading(false)
    if (!notifiedRef.current) {
      notifiedRef.current = true
      onCompleteRef.current?.()
    }
  }, [])

  // Priority images are preloaded above the fold; a gray flash over the hero
  // is worse than no placeholder, so only lazy images get the skeleton.
  const showSkeleton = isLoading && !priority

  return (
    <div
      className={`relative overflow-hidden ${fill ? "h-full w-full" : ""} ${className}`}
    >
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        {...(fill ? { fill: true } : { width, height })}
        sizes={sizes || DEFAULT_SIZES}
        quality={quality}
        preload={priority}
        loading={priority ? "eager" : undefined}
        referrerPolicy={referrerPolicy}
        className={imageClassName}
        onLoad={() => {
          setIsLoading(false)
          notifyLoaded()
        }}
        onError={onError}
      />
      {showSkeleton && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse bg-gray-200 motion-reduce:animate-none"
        />
      )}
    </div>
  )
}
