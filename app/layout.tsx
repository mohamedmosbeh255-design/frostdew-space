import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })

const title = 'FrostDew | K-Beauty Skincare for a Winter-Proof Glow'
const description =
  'Shop a curated collection of Korean skincare: serums, toners, sheet masks, sunscreens and more from trusted K-beauty brands.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: 'FrostDew',
    type: 'website',
    images: [{ url: '/hero/hero-poster.jpg', alt: 'FrostDew winter skincare' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/hero/hero-poster.jpg'] },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#294a67',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
