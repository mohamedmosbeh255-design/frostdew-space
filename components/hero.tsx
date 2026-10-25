"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let frame = 0
    const update = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / (section.offsetHeight * 0.9)))
      section.style.setProperty("--scroll-p", progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-height relative w-full overflow-hidden"
      aria-label="FROSTDEW — K-Beauty Skincare"
    >
      <div
        className="absolute inset-0"
        style={{ transform: "scale(calc(1.02 + var(--scroll-p, 0) * 0.06))" }}
      >
        {videoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/hero/hero-poster.jpg" alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="/hero/hero-video.mp4"
            poster="/hero/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            onCanPlay={() => videoRef.current?.play().catch(() => undefined)}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-winter opacity-[0.16]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-snow" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-midnight/30 to-transparent" aria-hidden="true" />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{
          opacity: "clamp(0, calc(1 - var(--scroll-p, 0) * 1.9), 1)",
          transform: "translate3d(0, calc(var(--scroll-p, 0) * -34px), 0)",
        }}
      >
        <p
          className="animate-brand-in mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-ice sm:text-xs"
          style={{ animationDelay: "0.25s" }}
        >
          K-Beauty Skincare
        </p>
        <h1
          className="animate-brand-in brand-title font-display text-[clamp(2.5rem,12.5vw,6rem)] font-medium leading-none tracking-[0.14em] text-white"
          style={{ animationDelay: "0.45s" }}
        >
          FROSTDEW
        </h1>
        <p
          className="animate-brand-in brand-title mt-5 max-w-md font-display text-lg font-medium italic text-white sm:text-xl"
          style={{ animationDelay: "0.7s" }}
        >
          Skincare for a Winter-Proof Glow
        </p>
        <a
          href="#shop"
          className="animate-brand-in mt-9 inline-flex items-center rounded-full border border-white/70 bg-white/15 px-7 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-md transition-colors hover:bg-white hover:text-winter"
          style={{ animationDelay: "0.95s" }}
        >
          Shop the collection
        </a>
      </div>

      <a
        href="#shop"
        aria-label="Scroll to products"
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-winter"
        style={{ opacity: "clamp(0, calc(1 - var(--scroll-p, 0) * 4), 1)" }}
      >
        <ChevronDown className="animate-cue-float h-5 w-5" />
      </a>
    </section>
  )
}
