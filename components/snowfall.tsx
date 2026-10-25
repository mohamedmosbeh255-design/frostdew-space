"use client"

import { useEffect, useMemo, useState } from "react"

interface Flake {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
  sway: number
  swayDuration: number
  glyph: boolean
}

function SnowflakeGlyph({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="rgba(255,255,255,0.95)"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 2px rgba(93,143,179,0.5))" }}
    >
      <path d="M12 2v20M4 6l16 12M20 6L4 18M12 2l-2.2 2.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2M4 6l3 .8M4 6l.8 3M20 18l-3-.8M20 18l-.8-3M20 6l-3 .8M20 6l-.8 3M4 18l3-.8M4 18l.8-3" />
    </svg>
  )
}

export default function Snowfall() {
  const [width, setWidth] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const measure = () => setWidth(window.innerWidth)
    measure()
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(measure, 250)
    }
    const onVisibility = () => setPaused(document.hidden)
    window.addEventListener("resize", onResize, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const flakes = useMemo<Flake[]>(() => {
    if (!width) return []
    const count = width < 640 ? 14 : width < 1024 ? 24 : 34
    return Array.from({ length: count }, (_, id) => {
      const size = 2 + Math.random() * 5
      const glyph = size > 4.6
      return {
        id,
        left: Math.random() * 100,
        size,
        duration: (12 + Math.random() * 16) * (glyph ? 1.15 : 1),
        delay: -Math.random() * 30,
        opacity: 0.85 * (0.35 + Math.random() * 0.6),
        sway: 6 + Math.random() * 14,
        swayDuration: 3.5 + Math.random() * 4.5,
        glyph,
      }
    })
  }, [width])

  if (flakes.length === 0) return null

  return (
    <div className={`snow-layer z-30 ${paused ? "snow-paused" : ""}`} aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snow-p"
          style={{
            left: `${f.left}%`,
            ["--dur" as string]: `${f.duration}s`,
            ["--delay" as string]: `${f.delay}s`,
          }}
        >
          <span
            className="snow-i"
            style={{
              ["--size" as string]: `${f.size}px`,
              ["--o" as string]: String(f.opacity),
              ["--sway" as string]: `${f.sway}px`,
              ["--sway-dur" as string]: `${f.swayDuration}s`,
            }}
          >
            {f.glyph ? <SnowflakeGlyph size={f.size * 2.4} /> : <span className="snow-dot" />}
          </span>
        </span>
      ))}
    </div>
  )
}
