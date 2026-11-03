/**
 * Client-safe routine analysis.
 *
 * This is an educational keyword model, not a diagnostic engine: it reads the
 * product and ingredient names the user pastes, groups them into routine steps,
 * and applies well-known dermatology rules of thumb (order, conflicts, pH,
 * step load). It never claims to know the full INCI of a product.
 */

export type RoutineSeverity = "good" | "warning" | "fix"
export type RoutineCategory = "order" | "compatibility" | "ph" | "steps"

export type ConcernKey =
  | "hydration"
  | "barrier"
  | "redness"
  | "acne"
  | "brightening"
  | "aging"
  | "pores"
  | "oil"
  | "sensitivity"
  | "texture"
  | "sun"
  | "lips"

export const CONCERN_LABELS: Record<ConcernKey, string> = {
  hydration: "Dehydration",
  barrier: "Barrier support",
  redness: "Redness",
  acne: "Breakouts",
  brightening: "Dark spots & tone",
  aging: "Fine lines & firmness",
  pores: "Pores",
  oil: "Oil control",
  sensitivity: "Sensitivity",
  texture: "Texture",
  sun: "Sun protection",
  lips: "Dry lips",
}

export const CONCERN_ORDER: ConcernKey[] = [
  "hydration",
  "barrier",
  "redness",
  "sensitivity",
  "acne",
  "oil",
  "pores",
  "texture",
  "brightening",
  "aging",
  "sun",
  "lips",
]

export type ActiveKey =
  | "aha"
  | "bha"
  | "pha"
  | "retinoid"
  | "vitaminC"
  | "niacinamide"
  | "bpo"
  | "azelaic"
  | "copper"
  | "fragrance"
  | "alcohol"
  | "physicalUv"
  | "chemicalUv"
  | "hyaluronic"
  | "ceramide"
  | "panthenol"
  | "centella"
  | "snail"
  | "peptide"
  | "propolis"
  | "rice"
  | "pdrn"
  | "collagen"
  | "teaTree"
  | "scrub"

export const ACTIVE_LABELS: Record<ActiveKey, string> = {
  aha: "AHA",
  bha: "BHA",
  pha: "PHA",
  retinoid: "Retinoid",
  vitaminC: "Vitamin C",
  niacinamide: "Niacinamide",
  bpo: "Benzoyl peroxide",
  azelaic: "Azelaic acid",
  copper: "Copper peptides",
  fragrance: "Fragrance",
  alcohol: "Alcohol",
  physicalUv: "Mineral UV filters",
  chemicalUv: "Chemical UV filters",
  hyaluronic: "Hyaluronic acid",
  ceramide: "Ceramides",
  panthenol: "Panthenol",
  centella: "Centella",
  snail: "Snail mucin",
  peptide: "Peptides",
  propolis: "Propolis",
  rice: "Rice extract",
  pdrn: "PDRN",
  collagen: "Collagen",
  teaTree: "Tea tree",
  scrub: "Physical scrub",
}

export type StepKind =
  | "cleanse"
  | "exfoliate"
  | "tone"
  | "treat"
  | "eye"
  | "mask"
  | "moisturize"
  | "oil"
  | "sunscreen"
  | "lip"
  | "other"

export type DetectedStep = {
  /** Original line, trimmed for display. */
  line: string
  kind: StepKind
  label: string
  /** Canonical application order; 0 means the step is not order-checked. */
  rank: number
  actives: ActiveKey[]
}

export type RoutineIssue = {
  id: string
  category: RoutineCategory
  severity: RoutineSeverity
  title: string
  detail: string
  fix: string
}

export type RoutineCounts = {
  steps: number
  actives: number
  exfoliants: number
  leaveOn: number
}

export type RoutineAnalysis = {
  steps: DetectedStep[]
  issues: RoutineIssue[]
  score: number
  breakdown: Record<RoutineCategory, number>
  concerns: ConcernKey[]
  summary: string
  counts: RoutineCounts
  nightRoutine: boolean
}

const ACTIVE_PATTERNS: Record<ActiveKey, RegExp> = {
  aha: /\b(?:aha|glycolic|lactic|mandelic|malic|tartaric)\b/i,
  bha: /\b(?:bha|salicylic|betaine salicylate)\b/i,
  pha: /\b(?:pha|gluconolactone|lactobionic)\b/i,
  retinoid: /\b(?:retinoid|retinol|retinal|retinaldehyde|tretinoin|adapalene|tazarotene|bakuchiol)\b/i,
  vitaminC: /\b(?:vitamin c|ascorbic acid|ascorbyl|ethyl ascorbic)\b/i,
  niacinamide: /\bniacinamide\b/i,
  bpo: /\b(?:benzoyl peroxide|bpo)\b/i,
  azelaic: /\bazelaic acid\b/i,
  copper: /\b(?:copper peptide|ghk-cu)\b/i,
  fragrance: /\b(?:fragrance|parfum|essential oil|limonene|linalool)\b/i,
  alcohol: /\b(?:alcohol denat|denatured alcohol|ethanol)\b/i,
  physicalUv: /\b(?:zinc oxide|titanium dioxide)\b/i,
  chemicalUv: /\b(?:avobenzone|octinoxate|octocrylene|bemotrizinol|tinosorb|mexoryl)\b/i,
  hyaluronic: /\b(?:hyaluronic acid|sodium hyaluronate|hyaluron)\b/i,
  ceramide: /\bceramide/i,
  panthenol: /\b(?:panthenol|vitamin b5)\b/i,
  centella: /\b(?:centella|cica|madecassoside|asiaticoside)\b/i,
  snail: /\bsnail\b/i,
  peptide: /\bpeptides?\b/i,
  propolis: /\bpropolis\b/i,
  rice: /\brice\b/i,
  pdrn: /\bpdrn\b/i,
  collagen: /\bcollagen\b/i,
  teaTree: /\btea tree\b/i,
  scrub: /\b(?:scrub|walnut shell|sugar scrub|physical exfoliant)\b/i,
}

const SUNSCREEN = /\b(?:spf|sunscreen|sun screen|sun serum|sun cream|sun milk|uv lock|uv defense|broad[- ]spectrum)\b|pa\+{2,}/i
const CLEANSER = /\b(?:cleanser|cleansing|face wash|foam|makeup remover|cleansing balm|cleansing oil)\b/i
const EXFOLIATE = /\b(?:exfoliat|peel|peeling|toner pad|miracle toner)\b/i
const LIP = /\blip\b/i
const MASK = /\b(?:mask|hydrogel|wrapping)\b/i
const EYE = /\beye\b/i
const TONER = /\btoner\b/i
const TREAT = /\b(?:serum|ampoule|essence|booster|shot|treatment|activating)\b/i
const MOISTURIZE = /\b(?:moisturi[sz]er|cream|lotion|emulsion|gel cream|barrier|balm)\b/i
const OIL = /\b(?:facial oil|face oil|oil)\b/i

const STEP_META: Record<StepKind, { label: string; rank: number }> = {
  cleanse: { label: "Cleanse", rank: 1 },
  exfoliate: { label: "Exfoliate", rank: 2 },
  tone: { label: "Tone", rank: 3 },
  treat: { label: "Treat", rank: 4 },
  eye: { label: "Eye care", rank: 5 },
  mask: { label: "Mask", rank: 6 },
  moisturize: { label: "Moisturize", rank: 7 },
  oil: { label: "Seal", rank: 8 },
  sunscreen: { label: "Protect", rank: 9 },
  lip: { label: "Lip care", rank: 0 },
  other: { label: "Other", rank: 0 },
}

/** Steps that participate in order-inversion checks. Masks, eye care and lip care are excluded on purpose. */
const ORDER_RANKS: Partial<Record<StepKind, number>> = {
  cleanse: 1,
  exfoliate: 2,
  tone: 3,
  treat: 4,
  moisturize: 7,
  oil: 8,
  sunscreen: 9,
}

const LEAVE_ON_KINDS: StepKind[] = ["tone", "treat", "eye", "moisturize", "oil", "mask"]
const BARRIER_ACTIVES: ActiveKey[] = ["ceramide", "panthenol", "centella", "snail", "peptide"]

const CONCERN_PATTERNS: Record<ConcernKey, RegExp> = {
  hydration: /\b(?:dry|dehydrat|tight|flak|rough|parched|hyaluron|snail|rice|panthenol)\b/i,
  barrier: /\b(?:barrier|ceramide|repair|eczema|irritat|sting|sensitive|reactive)\b/i,
  redness: /\b(?:red|redness|rosacea|sensitive|irritat|centella|cica|azelaic)\b/i,
  acne: /\b(?:acne|breakout|blemish|pimple|congest|salicylic|benzoyl|tea tree)\b/i,
  brightening: /\b(?:dark spot|hyperpigment|bright|uneven tone|dull|glow|vitamin c|niacinamide|propolis)\b/i,
  aging: /\b(?:fine line|wrinkle|firm|sag|aging|photoaging|retinol|retinal|peptide|collagen|pdrn)\b/i,
  pores: /\b(?:pore|blackhead|sebum)\b/i,
  oil: /\b(?:oily|sebum|greasy|shine)\b/i,
  sensitivity: /\b(?:sensitive|reactive|irritat|redness|fragrance|sting)\b/i,
  texture: /\b(?:texture|rough|bump|exfoliat|aha|bha|pha|peel)\b/i,
  sun: /\b(?:spf|sunscreen|sun|uv)\b/i,
  lips: /\b(?:lip|chapped)\b/i,
}

const HEALTHY_LABELS = new Set([
  "hydration",
  "barrier",
  "redness",
  "acne",
  "brightening",
  "aging",
  "pores",
  "oil",
  "sensitivity",
  "texture",
  "sun",
  "lips",
])

function detectActives(line: string): ActiveKey[] {
  return (Object.keys(ACTIVE_PATTERNS) as ActiveKey[]).filter((key) =>
    ACTIVE_PATTERNS[key].test(line),
  )
}

function isExfoliating(actives: ActiveKey[]): boolean {
  return actives.some((active) => active === "aha" || active === "bha" || active === "pha" || active === "scrub")
}

function classifyStep(line: string, actives: ActiveKey[]): StepKind {
  if (SUNSCREEN.test(line)) return "sunscreen"
  if (CLEANSER.test(line)) return "cleanse"
  if (isExfoliating(actives) || EXFOLIATE.test(line)) return "exfoliate"
  if (LIP.test(line)) return "lip"
  if (MASK.test(line)) return "mask"
  if (EYE.test(line)) return "eye"
  if (TONER.test(line)) return "tone"
  if (TREAT.test(line)) return "treat"
  if (MOISTURIZE.test(line)) return "moisturize"
  if (OIL.test(line)) return "oil"
  return "other"
}

/** Splits a pasted routine into lines and drops pure AM/PM headings. */
export function splitRoutine(text: string): string[] {
  return text
    .split(/\r?\n|→|->/g)
    .map((line) =>
      line
        .replace(/^\s*(?:\d+[.)]\s*|[-•*–—]\s*)/, "")
        .replace(/^(?:am|pm|morning|evening|night)\s*[:\-]\s*/i, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line && !/^(?:am|pm|morning|evening|night|routine)\s*:?$/i.test(line))
}

function snippet(line: string, max = 84): string {
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line
}

function emptyAnalysis(): RoutineAnalysis {
  return {
    steps: [],
    issues: [],
    score: 0,
    breakdown: { order: 0, compatibility: 0, ph: 0, steps: 0 },
    concerns: ["hydration", "barrier"],
    summary: "Paste a routine to see how it scores.",
    counts: { steps: 0, actives: 0, exfoliants: 0, leaveOn: 0 },
    nightRoutine: false,
  }
}

export function scoreVerdict(score: number): { label: string; tone: "good" | "warning" | "fix" } {
  if (score >= 85) return { label: "Balanced routine", tone: "good" }
  if (score >= 70) return { label: "Solid, with friction points", tone: "warning" }
  if (score >= 50) return { label: "Needs a reset", tone: "warning" }
  return { label: "Working against your barrier", tone: "fix" }
}

export function analyzeRoutine(input: string): RoutineAnalysis {
  const lines = splitRoutine(input)
  if (lines.length === 0) return emptyAnalysis()

  const hasMorningMarker = /\b(?:am|morning)\b/i.test(input)
  const hasNightMarker = /\b(?:pm|evening|bedtime|night[- ]?routine|nighttime)\b/i.test(input)
  // Treat the routine as evening-only when PM is marked and AM is not. A
  // pasted AM+PM routine should still be checked for morning sunscreen.
  const nightRoutine = hasNightMarker && !hasMorningMarker
  const steps: DetectedStep[] = lines.map((line) => {
    const actives = detectActives(line)
    const kind = classifyStep(line, actives)
    const meta = STEP_META[kind]
    return { line, kind, label: meta.label, rank: meta.rank, actives }
  })

  const issues: RoutineIssue[] = []
  const add = (issue: RoutineIssue) => issues.push(issue)

  const has = (active: ActiveKey) => steps.some((step) => step.actives.includes(active))
  const findAll = (kind: StepKind) => steps.filter((step) => step.kind === kind)
  const exfoliantSteps = steps.filter((step) => isExfoliating(step.actives))
  const acidSteps = steps.filter((step) =>
    step.actives.some((active) => active === "aha" || active === "bha" || active === "pha"),
  )
  const vitaminCSteps = steps.filter((step) => step.actives.includes("vitaminC"))
  const leaveOn = steps.filter((step) => LEAVE_ON_KINDS.includes(step.kind))
  const stepCount = steps.length
  const sensitiveMarkers = /\b(?:sensitive|reactive|irritat|redness|rosacea|eczema|barrier)\b/i.test(input)

  // ---------------------------------------------------------------- order
  const cleanserIndex = steps.findIndex((step) => step.kind === "cleanse")
  if (cleanserIndex > 0) {
    add({
      id: "order-cleanser-late",
      category: "order",
      severity: "fix",
      title: "Cleanse before anything else",
      detail: `“${snippet(steps[cleanserIndex].line)}” appears after other steps. Cleansers remove sunscreen, oil and debris; leave-on products applied first are partly washed away.`,
      fix: "Move your cleanser to step one, then pat dry before the next layer.",
    })
  } else if (cleanserIndex === -1 && stepCount >= 2) {
    add({
      id: "order-no-cleanser",
      category: "order",
      severity: "warning",
      title: "No cleanser detected",
      detail: "A leave-on routine still starts on skin that needs cleansing. If you cleanse but did not list it, add it so the order check is accurate.",
      fix: "Start with a gentle low-pH cleanser, morning and night.",
    })
  }

  const sunscreenIndex = steps.findIndex((step) => step.kind === "sunscreen")
  if (sunscreenIndex === -1) {
    if (nightRoutine) {
      add({
        id: "order-night-no-spf",
        category: "order",
        severity: "good",
        title: "No sunscreen — correct for a night routine",
        detail: "You marked this as an evening routine. Sunscreen belongs in the morning, as the final step.",
        fix: "Keep a broad-spectrum SPF 30–50+ for your AM routine.",
      })
    } else {
      add({
        id: "order-no-spf",
        category: "order",
        severity: "warning",
        title: "No sunscreen detected",
        detail: "UV exposure drives dark spots, fine lines and barrier stress. If this is your morning routine, the protection step is missing.",
        fix: "Finish every morning with a broad-spectrum SPF 30–50+ (PA+++ or higher).",
      })
    }
  } else {
    const afterSunscreen = steps.slice(sunscreenIndex + 1).filter((step) => step.kind !== "lip")
    if (afterSunscreen.length > 0) {
      add({
        id: "order-spf-not-last",
        category: "order",
        severity: "fix",
        title: "Sunscreen is not the final step",
        detail: `“${snippet(afterSunscreen[0].line)}” comes after sunscreen. Layering over SPF can disturb the film and reduce real-world protection.`,
        fix: "Move sunscreen to the very end of your morning routine; make it the last thing you apply.",
      })
    } else {
      add({
        id: "order-spf-last",
        category: "order",
        severity: "good",
        title: "Sunscreen is in the right place",
        detail: "SPF is the final step, which is exactly where it belongs in a morning routine.",
        fix: "Use about a quarter teaspoon for the face and neck, and reapply outdoors.",
      })
    }
  }

  const ordered = steps.filter((step) => ORDER_RANKS[step.kind] !== undefined)
  const inversions: Array<{ first: DetectedStep; second: DetectedStep; gap: number }> = []
  for (let i = 0; i < ordered.length; i += 1) {
    for (let j = i + 1; j < ordered.length; j += 1) {
      const first = ordered[i]
      const second = ordered[j]
      if (first.kind === "cleanse" || second.kind === "cleanse") continue
      if (first.kind === "sunscreen" || second.kind === "sunscreen") continue
      const firstRank = ORDER_RANKS[first.kind] ?? 0
      const secondRank = ORDER_RANKS[second.kind] ?? 0
      if (firstRank > secondRank) inversions.push({ first, second, gap: firstRank - secondRank })
    }
  }

  if (inversions.length > 0) {
    const worst = inversions.reduce((acc, item) => (item.gap > acc.gap ? item : acc), inversions[0])
    add({
      id: "order-inversion",
      category: "order",
      severity: worst.gap >= 2 ? "fix" : "warning",
      title: "Application order is out of sequence",
      detail: `“${snippet(worst.first.line)}” is listed before “${snippet(worst.second.line)}”, but the second product belongs earlier. Thin, water-based layers need to go on before creams and oils.`,
      fix: "Reorder to cleanse → exfoliate → tone → treat → moisturize → sunscreen (AM).",
    })
  }

  if (cleanserIndex === 0) {
    add({
      id: "order-cleanser-first",
      category: "order",
      severity: "good",
      title: "Cleanser starts the routine",
      detail: "Your first step removes the day's buildup so the products that follow can actually do their job.",
      fix: "Keep the water lukewarm and avoid scrubbing the skin.",
    })
  }

  // -------------------------------------------------------- compatibility
  const exfoliantCount = exfoliantSteps.length
  if (exfoliantCount >= 2) {
    add({
      id: "compat-multiple-exfoliants",
      category: "compatibility",
      severity: exfoliantCount >= 3 ? "fix" : "warning",
      title: exfoliantCount >= 3 ? "Too many exfoliating products" : "Two exfoliating products in one routine",
      detail: `${exfoliantCount} steps contain exfoliating acids or a scrub. Stacking them increases the chance of stinging, flaking and a compromised barrier without speeding up results.`,
      fix: "Keep one exfoliating product, two to three nights a week, and drop the rest.",
    })
  }

  if (has("retinoid") && exfoliantCount > 0) {
    add({
      id: "compat-retinoid-acid",
      category: "compatibility",
      severity: "fix",
      title: "Retinoid and exfoliating acid together",
      detail: "Retinoids already accelerate turnover. Layering an AHA, BHA, PHA or scrub in the same routine multiplies irritation and can make the barrier raw.",
      fix: "Use them on alternate nights, not the same evening, and keep a plain moisturizer in between.",
    })
  }

  if (has("bpo") && has("vitaminC")) {
    add({
      id: "compat-bpo-vitc",
      category: "compatibility",
      severity: "fix",
      title: "Benzoyl peroxide and vitamin C",
      detail: "Benzoyl peroxide is a strong oxidiser and can degrade L-ascorbic acid, while the combination is needlessly irritating for most skin.",
      fix: "Use benzoyl peroxide as a spot treatment at night and vitamin C in the morning.",
    })
  }

  if (has("bpo") && has("retinoid")) {
    add({
      id: "compat-bpo-retinoid",
      category: "compatibility",
      severity: "warning",
      title: "Benzoyl peroxide with a retinoid",
      detail: "The pair can be effective for acne, but layering them at the same time is a common cause of peeling and stinging. Some retinoids are also less stable alongside peroxide.",
      fix: "Alternate nights, or use the peroxide only as a short-contact spot treatment.",
    })
  }

  if (has("vitaminC") && has("copper")) {
    add({
      id: "compat-vitc-copper",
      category: "compatibility",
      severity: "warning",
      title: "Vitamin C with copper peptides",
      detail: "The acidic, reducing environment that keeps L-ascorbic acid stable can work against copper peptide complexes. The evidence is mostly formulation-based, but separating them is the cautious choice.",
      fix: "Use vitamin C in the morning and copper peptides at night.",
    })
  }

  if (has("retinoid") && has("vitaminC")) {
    add({
      id: "compat-retinoid-vitc",
      category: "compatibility",
      severity: "warning",
      title: "Retinoid with vitamin C",
      detail: "Both are useful, but together they raise the irritation load — especially with high-strength L-ascorbic acid and a new retinoid.",
      fix: "Split them: vitamin C in the morning, retinoid at night. Reduce frequency if you sting.",
    })
  }

  if (has("scrub") && (has("aha") || has("bha") || has("pha") || has("retinoid"))) {
    add({
      id: "compat-scrub-actives",
      category: "compatibility",
      severity: "warning",
      title: "Physical scrub on top of chemical exfoliation",
      detail: "A scrub adds friction on skin that is already turning over faster. That is a recipe for micro-tears and redness.",
      fix: "Pause the scrub while you use acids or a retinoid; use gentle pressure and no more than once a week if you keep it.",
    })
  }

  const activeFamilies = [
    has("retinoid"),
    has("vitaminC"),
    has("bpo"),
    has("azelaic"),
    exfoliantCount > 0,
  ].filter(Boolean).length
  if (activeFamilies >= 4) {
    add({
      id: "compat-active-overload",
      category: "compatibility",
      severity: "warning",
      title: "Four or more active families at once",
      detail: "Retinoids, vitamin C, benzoyl peroxide, azelaic acid and exfoliating acids all ask something of the barrier. Using them together makes it hard to tell what helps and what irritates.",
      fix: "Pick one primary active, give it four to six weeks, then add a second only if your skin is calm.",
    })
  }

  if (has("niacinamide") && has("vitaminC")) {
    add({
      id: "compat-niacinamide-vitc",
      category: "compatibility",
      severity: "good",
      title: "Niacinamide and vitamin C can share a routine",
      detail: "The old “they cancel out” warning comes from unstable, heated lab conditions, not modern cosmetic formulas. They can be layered or used in the same serum.",
      fix: "Introduce one at a time if your skin is reactive, and watch for stinging rather than avoiding the pair.",
    })
  }

  if (has("retinoid") && BARRIER_ACTIVES.some((active) => has(active))) {
    add({
      id: "compat-retinoid-barrier",
      category: "compatibility",
      severity: "good",
      title: "Retinoid paired with barrier support",
      detail: "Ceramides, panthenol, centella or peptides help cushion the dryness and tightness that often come with retinoid use.",
      fix: "Apply the barrier product after the retinoid, and keep it on the nights you skip the active.",
    })
  }

  if ((has("fragrance") || has("alcohol")) && sensitiveMarkers) {
    add({
      id: "compat-fragrance-sensitive",
      category: "compatibility",
      severity: "warning",
      title: "Fragrance or alcohol with sensitive-skin signals",
      detail: "You mentioned sensitivity, redness or barrier trouble, and at least one product lists fragrance or denatured alcohol. Neither is universally bad, but both are common triggers when the barrier is already stressed.",
      fix: "Switch to fragrance-free, alcohol-free formulas until the skin settles, then reintroduce one product at a time.",
    })
  }

  // ------------------------------------------------------------------- pH
  if (acidSteps.length > 0 && vitaminCSteps.length > 0) {
    add({
      id: "ph-acids-vitc",
      category: "ph",
      severity: "warning",
      title: "Acids and vitamin C in the same routine",
      detail: "L-ascorbic acid needs a low pH to work, while AHA/BHA products are also acidic. Layering them can push the routine below the skin's comfort zone and cause stinging.",
      fix: "Use vitamin C in the morning and exfoliating acids at night, or alternate days.",
    })
  }

  const harshCleanser = steps.find(
    (step) => step.kind === "cleanse" && /\b(?:soap|alkaline|high[- ]ph)\b/i.test(step.line),
  )
  if (harshCleanser && acidSteps.length > 0) {
    add({
      id: "ph-harsh-cleanser-acid",
      category: "ph",
      severity: "warning",
      title: "High-pH cleanser before acidic treatments",
      detail: "A soapy, alkaline cleanser raises skin pH and can leave acids working against a less favourable environment — and it feels stripping before actives.",
      fix: "Use a low-pH or amino-acid cleanser before exfoliating treatments.",
    })
  }

  const lowPhCleanser = steps.find(
    (step) =>
      step.kind === "cleanse" &&
      /\b(?:low[- ]ph|amino acid|weakly acidic|ph 5(?:\.5)?)\b/i.test(step.line),
  )
  if (lowPhCleanser && acidSteps.length > 0) {
    add({
      id: "ph-low-cleanser-acid",
      category: "ph",
      severity: "good",
      title: "Low-pH cleanser supports your acids",
      detail: "A gently acidic cleanser leaves the skin closer to its natural pH, so the exfoliating step that follows is less disruptive.",
      fix: "Keep the cleanser in place and avoid a second, foaming cleanse before the acid.",
    })
  }

  if (vitaminCSteps.length > 0) {
    const vitcIndex = steps.findIndex((step) => step.kind !== "other" && step.actives.includes("vitaminC"))
    const creamBefore = steps.some(
      (step, index) =>
        index < vitcIndex && (step.kind === "moisturize" || step.kind === "oil" || step.kind === "mask"),
    )
    if (creamBefore) {
      add({
        id: "ph-vitc-after-cream",
        category: "ph",
        severity: "warning",
        title: "Vitamin C is listed after a cream or oil",
        detail: "L-ascorbic acid absorbs best on clean, dry skin. A cream or oil underneath slows penetration and can make the vitamin C feel tacky or sting.",
        fix: "Apply vitamin C after cleansing and toning, before moisturizer.",
      })
    } else if (vitaminCSteps.some((step) => step.kind === "treat" || step.kind === "tone")) {
      add({
        id: "ph-vitc-position",
        category: "ph",
        severity: "good",
        title: "Vitamin C is positioned before creams",
        detail: "Your vitamin C sits in the treatment layer, where a low-pH formula has the best chance of absorbing evenly.",
        fix: "Pat it in, give it a minute, then continue with hydration and moisturizer.",
      })
    }
  }

  // ---------------------------------------------------------------- steps
  if (stepCount <= 4) {
    add({
      id: "steps-minimal",
      category: "steps",
      severity: "good",
      title: "Minimal, focused routine",
      detail: "Short routines are easier to keep consistent, and consistency matters more than the number of products.",
      fix: "Make sure the basics are covered: cleanse, moisturize, protect (AM).",
    })
  } else if (stepCount <= 8 && activeFamilies >= 4) {
    add({
      id: "steps-many-actives",
      category: "steps",
      severity: "warning",
      title: "The step count is fine — the active load is not",
      detail: `${stepCount} steps is manageable, but ${activeFamilies} active families in one routine is where over-exfoliation starts. Each extra active adds irritation risk before it adds results.`,
      fix: "Keep one primary active and one supporting hydrator; pause the rest for two weeks before reintroducing anything.",
    })
  } else if (stepCount <= 8) {
    add({
      id: "steps-manageable",
      category: "steps",
      severity: "good",
      title: "Manageable step count",
      detail: `${stepCount} steps is a practical range. More products only help if each one has a clear job.`,
      fix: "If a step has no obvious purpose, take it out for two weeks and see whether anything changes.",
    })
  } else if (stepCount <= 11) {
    add({
      id: "steps-long",
      category: "steps",
      severity: "warning",
      title: "Long routine — check for overlap",
      detail: `${stepCount} steps is a lot to sustain. Long routines tend to accumulate duplicate hydrators and extra actives rather than better results.`,
      fix: "Group products by job: one cleanser, one hydrator, one treatment, one moisturizer, one SPF.",
    })
  } else {
    add({
      id: "steps-too-long",
      category: "steps",
      severity: "fix",
      title: "Too many steps for most skin",
      detail: `${stepCount} steps makes it hard to identify what helps, and raises the chance of over-exfoliation and irritation.`,
      fix: "Cut back to a core routine for two weeks, then add back only what earns its place.",
    })
  }

  if (leaveOn.length > 7) {
    add({
      id: "steps-many-leave-on",
      category: "steps",
      severity: "warning",
      title: "Many leave-on layers",
      detail: `${leaveOn.length} leave-on products can pill, dilute each other, or simply add irritation without extra benefit.`,
      fix: "Keep two or three leave-on layers with distinct jobs and drop the rest.",
    })
  }

  if (!steps.some((step) => step.kind === "moisturize") && stepCount >= 2) {
    add({
      id: "steps-no-moisturizer",
      category: "steps",
      severity: "warning",
      title: "No moisturizer detected",
      detail: "Hydrating toners and serums add water, but a moisturizer helps hold it in. If your skin feels tight later in the day, this is usually why.",
      fix: "Add a light gel-cream or a ceramide cream as the last non-SPF step.",
    })
  }

  // -------------------------------------------------------------- scoring
  const breakdown: Record<RoutineCategory, number> = {
    order: 25,
    compatibility: 25,
    ph: 25,
    steps: 25,
  }
  for (const issue of issues) {
    if (issue.severity === "good") continue
    const penalty = issue.severity === "fix" ? 18 : 8
    breakdown[issue.category] = Math.max(0, breakdown[issue.category] - penalty)
  }
  const score = Object.values(breakdown).reduce((total, value) => total + value, 0)

  // ------------------------------------------------------------ concerns
  const concerns = new Set<ConcernKey>()
  for (const key of CONCERN_ORDER) {
    if (CONCERN_PATTERNS[key].test(input)) concerns.add(key)
  }
  if (has("retinoid")) {
    concerns.add("aging")
    concerns.add("texture")
  }
  if (has("vitaminC")) concerns.add("brightening")
  if (has("niacinamide")) concerns.add("brightening")
  if (has("bpo") || has("azelaic")) concerns.add("acne")
  if (has("azelaic") || has("centella")) concerns.add("redness")
  if (has("hyaluronic") || has("snail") || has("ceramide") || has("panthenol")) {
    concerns.add("hydration")
    concerns.add("barrier")
  }
  if (exfoliantCount >= 2 || (has("retinoid") && exfoliantCount > 0)) {
    concerns.add("barrier")
    concerns.add("sensitivity")
  }
  if (sunscreenIndex === -1 && !nightRoutine) concerns.add("sun")
  if (steps.some((step) => step.kind === "lip")) concerns.add("lips")
  // A short, plain routine can legitimately produce almost no concern tags.
  // Offer the two universal basics instead of falling back to a lone "sun".
  if (concerns.size <= 1) {
    concerns.add("hydration")
    concerns.add("barrier")
  }
  // Never recommend from copy alone: only valid concern keys leave this set.
  const orderedConcerns = Array.from(concerns)
    .filter((key): key is ConcernKey => HEALTHY_LABELS.has(key))
    .sort((a, b) => CONCERN_ORDER.indexOf(a) - CONCERN_ORDER.indexOf(b))

  const counts: RoutineCounts = {
    steps: stepCount,
    actives: new Set(
      steps.flatMap((step) =>
        step.actives.filter((active) =>
          ["aha", "bha", "pha", "retinoid", "vitaminC", "niacinamide", "bpo", "azelaic", "scrub"].includes(active),
        ),
      ),
    ).size,
    exfoliants: exfoliantCount,
    leaveOn: leaveOn.length,
  }

  const summary =
    score >= 85
      ? "Your routine is in good shape. A few small sequencing tweaks can make it work harder."
      : score >= 70
        ? "A solid foundation, with a couple of friction points worth fixing before you add anything new."
        : score >= 50
          ? "There are real conflicts here. Simplify first, then rebuild around the basics."
          : "This routine is fighting your barrier. Reset to cleanse, moisturize and SPF before restarting actives."

  return {
    steps,
    issues,
    score,
    breakdown,
    concerns: orderedConcerns,
    summary,
    counts,
    nightRoutine,
  }
}

export function severityLabel(severity: RoutineSeverity): string {
  if (severity === "good") return "Working well"
  if (severity === "warning") return "Watch"
  return "Fix"
}
