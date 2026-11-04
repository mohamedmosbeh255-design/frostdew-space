const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/**
 * Public files that never change in place. Generated Next.js assets
 * (`/_next/static`) already ship with immutable caching; these are the
 * hand-maintained icons, logo, and any self-hosted font files.
 */
const STATIC_ASSET_SOURCES = [
  '/icon.svg',
  '/icon-dark-32x32.png',
  '/icon-light-32x32.png',
  '/apple-icon.png',
  '/placeholder-logo.svg',
  '/placeholder-logo.png',
  '/fonts/:path*',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only the quality values the app actually renders. Next.js 16 requires
    // this allowlist when the optimizer is enabled.
    qualities: [75],
    // Catalog images are static store/CDN files, so a longer optimizer cache
    // reduces repeat fetches without risking stale admin uploads.
    minimumCacheTTL: 14400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'wlbsswmkoahjzentukns.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-image.oliveyoung.com',
        pathname: '/prdtImg/**',
      },
      {
        protocol: 'https',
        hostname: 'sv9-cdn.stylevana.com',
        pathname: '/media/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      ...STATIC_ASSET_SOURCES.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      })),
    ]
  },
}

export default nextConfig
