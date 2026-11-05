"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

/**
 * The audio concierge is split out of the first-paint bundle on purpose. It is
 * only downloaded after the page has finished loading and the browser is idle,
 * so the main content never waits on speech or catalog code.
 */
const AudioAssistant = dynamic(() => import("./audio-assistant"), {
  ssr: false,
})

export default function AudioExperience() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleId: number | undefined
    let timeoutId: number | undefined

    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => setReady(true), { timeout: 4000 })
      } else {
        timeoutId = window.setTimeout(() => setReady(true), 1500)
      }
    }

    if (document.readyState === "complete") {
      schedule()
    } else {
      window.addEventListener("load", schedule, { once: true })
    }

    return () => {
      window.removeEventListener("load", schedule)
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  if (!ready) return null
  return <AudioAssistant />
}
