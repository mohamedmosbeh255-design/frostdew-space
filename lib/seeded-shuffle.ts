/**
 * Fisher-Yates shuffle seeded with a numeric key.
 *
 * The shuffle is pure: it operates on a copy of the input array and has no
 * side effects (it never reads Date.now() or any global state). Given the same
 * array and seed it always returns the same result, which is what lets the
 * homepage rotation stay deterministic across every visitor inside a window.
 */

/** Seeded 32-bit PRNG (mulberry32). Returns floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Returns a shuffled copy of `array` using `seed` as the shuffle key.
 * The input array is never mutated.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = array.slice()
  const random = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}