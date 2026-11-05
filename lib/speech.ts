/**
 * Web Speech helpers kept free of React so the quality rules are easy to
 * reason about and test.
 */

type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "voiceURI" | "lang"> & {
  default?: boolean
}

const QUALITY_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /premium/i, score: 6 },
  { pattern: /enhanced/i, score: 5 },
  { pattern: /neural/i, score: 4 },
  { pattern: /natural/i, score: 4 },
  { pattern: /google/i, score: 3 },
  { pattern: /siri/i, score: 2 },
]

const LOW_QUALITY_PATTERNS = /compact|espeak|robot|novelty/i

export function normalizeVoiceLocale(locale: string): string {
  return locale.replace(/_/g, "-").toLowerCase()
}

/** Score a system voice, returning 0 when it is not a premium option. */
export function voiceQualityScore(voice: VoiceLike): number {
  const haystack = `${voice.name} ${voice.voiceURI}`.toLowerCase()
  if (LOW_QUALITY_PATTERNS.test(haystack)) return 0

  let score = 0
  for (const { pattern, score: weight } of QUALITY_PATTERNS) {
    if (pattern.test(haystack)) score = Math.max(score, weight)
  }
  return score
}

/**
 * Strict locale matching: a French UI only accepts `fr-FR` voices, never a
 * generic `fr` or an English fallback. Returns null when no premium voice
 * exists, which puts the player into Reading Mode.
 */
export function findPremiumVoice<T extends VoiceLike>(
  voices: readonly T[],
  locale: string,
): T | null {
  const target = normalizeVoiceLocale(locale)
  let best: { voice: T; score: number } | null = null

  for (const voice of voices) {
    if (normalizeVoiceLocale(voice.lang) !== target) continue
    const score = voiceQualityScore(voice)
    if (score === 0) continue

    if (
      !best ||
      score > best.score ||
      (score === best.score && Boolean(voice.default) && !best.voice.default) ||
      (score === best.score && voice.name.localeCompare(best.voice.name) < 0)
    ) {
      best = { voice, score }
    }
  }

  return best?.voice ?? null
}

export type NarrationSource = {
  brand: string
  name: string
  description: string
}

function sentence(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim()
  if (!clean) return ""
  return /[.!?…]$/.test(clean) ? clean : `${clean}.`
}

/** "[Brand]... [Product Name]... [Description]." */
export function buildNarration(product: NarrationSource): string {
  return [product.brand, product.name, product.description]
    .map(sentence)
    .filter(Boolean)
    .join(" ")
}

/** Rough spoken duration used by the visual Reading Mode fallback. */
export function estimateReadingDurationMs(text: string, wordsPerMinute = 165): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(3500, Math.round((words / wordsPerMinute) * 60_000))
}
