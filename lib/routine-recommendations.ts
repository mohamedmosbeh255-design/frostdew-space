/**
 * Curated catalog matches for the Routine Decoder.
 *
 * Recommendations are editorial, not algorithmic guesses: each product below
 * has a hand-written explanation, ingredient notes and an evidence summary.
 * `suggestProducts` only decides which of these entries fit the analysed
 * routine, so the copy stays accurate even as the catalog grows.
 */

import type { Product } from "@/lib/products"
import type { ConcernKey, RoutineAnalysis } from "@/lib/routine-analysis"

export type SuggestionCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "mask"
  | "lip"

export type IngredientNote = {
  name: string
  function: string
}

export type ProductKnowledge = {
  productId: string
  category: SuggestionCategory
  tags: ConcernKey[]
  why: string
  ingredients: IngredientNote[]
  evidence: string
  bestFor: string
  /** The product is itself an exfoliant; avoid stacking it on an acid routine. */
  exfoliating?: boolean
  /** The product contains a retinoid; avoid recommending a second one. */
  retinoid?: boolean
  /** The product is a dedicated vitamin C; avoid duplicating it. */
  vitaminC?: boolean
}

export type RoutineProductSuggestion = {
  product: Product
  knowledge: ProductKnowledge
  /** Short, routine-specific reasons shown as chips above the detail. */
  matchReasons: string[]
}

const CONCERN_REASON: Record<ConcernKey, string> = {
  hydration: "Adds water-binding hydration",
  barrier: "Supports a stressed barrier",
  redness: "Calms visible redness",
  acne: "Targets congestion and breakouts",
  brightening: "Helps even tone and dark spots",
  aging: "Supports firmness and fine lines",
  pores: "Refines the look of pores",
  oil: "Balances excess oil",
  sensitivity: "Formulated for reactive skin",
  texture: "Smooths rough texture",
  sun: "Adds daily UV protection",
  lips: "Cares for dry lips",
}

export const PRODUCT_KNOWLEDGE: ProductKnowledge[] = [
  {
    productId: "round-lab-1025-dokdo-cleanser-low-ph-hydrating-f",
    category: "cleanser",
    tags: ["hydration", "barrier", "sensitivity", "redness"],
    why: "A low-pH, amino-acid cleanser that removes daily grime without the tight, squeaky feeling that signals a stripped barrier. The short ingredient list makes it easy to tolerate alongside actives.",
    ingredients: [
      { name: "Amino-acid surfactants", function: "Cleanse at a skin-friendly pH without stripping" },
      { name: "Deep sea water", function: "Mineral-rich hydration base" },
      { name: "Glycerin", function: "Humectant that reduces post-wash tightness" },
    ],
    evidence:
      "Dermatologists generally recommend low-pH cleansers for dry and reactive skin. Harsh alkaline cleansers transiently raise skin pH and increase water loss, which is the opposite of what a barrier-repair routine needs.",
    bestFor: "Dry, sensitive or barrier-compromised skin; a safe first cleanse for most routines.",
  },
  {
    productId: "skin1004-madagascar-centella-double-cleansing-du",
    category: "cleanser",
    tags: ["acne", "sensitivity", "redness", "oil"],
    why: "An oil-to-foam pair that dissolves sunscreen and makeup before a gentle second cleanse. Centella keeps the process calming rather than stripping, which matters if you wear SPF every day.",
    ingredients: [
      { name: "Centella asiatica", function: "Soothing support for redness and reactivity" },
      { name: "Cleansing oil", function: "Dissolves sunscreen, sebum and makeup" },
      { name: "Ampoule foam", function: "A gentle second water-based cleanse" },
    ],
    evidence:
      "Double cleansing is well accepted for removing sunscreen and long-wear makeup. The second cleanse should stay gentle; over-cleaning is a common cause of dryness and reactive skin.",
    bestFor: "Anyone wearing SPF or makeup, especially oily and sensitive skin.",
  },
  {
    productId: "anua-heartleaf-77-soothing-toner-8-45-fl-oz",
    category: "toner",
    tags: ["redness", "sensitivity", "oil", "acne", "hydration"],
    why: "A watery 77% heartleaf toner with hyaluronic acid. It calms visible redness and adds a first layer of hydration without alcohol or fragrance — useful when actives have made skin feel warm.",
    ingredients: [
      { name: "Houttuynia cordata (heartleaf)", function: "Traditional soothing extract for redness" },
      { name: "Hyaluronic acid", function: "Pulls water into the upper skin layers" },
      { name: "Glycerin", function: "Humectant that softens and hydrates" },
    ],
    evidence:
      "Heartleaf is widely used in Korean soothing skincare; clinical evidence is modest but the fragrance-free, low-irritation base is a sensible choice for reactive skin. Hydrating toners can improve comfort without adding active load.",
    bestFor: "Redness-prone, sensitive or oily skin; also works as a quick DIY sheet mask.",
  },
  {
    productId: "anua-rice-70-glow-milky-toner-non-comedogenic-ko",
    category: "toner",
    tags: ["hydration", "brightening", "barrier"],
    why: "A milky toner built on 70% rice bran water with niacinamide and ceramides. It gives the soft, glassy hydration many people want from a toner while adding mild tone support.",
    ingredients: [
      { name: "Rice bran water", function: "Humectant and traditional brightening extract" },
      { name: "Niacinamide", function: "Supports barrier lipids and evens tone" },
      { name: "Ceramides", function: "Help reinforce the skin's lipid barrier" },
    ],
    evidence:
      "Niacinamide has clinical support at roughly 2–5% for barrier function and uneven tone. Rice extracts are traditional humectants with limited but positive cosmetic data; neither is a substitute for a dedicated treatment.",
    bestFor: "Dull, dehydrated skin that wants glow without a strong active.",
  },
  {
    productId: "some-by-mi-aha-bha-pha-30-days-miracle-toner-150",
    category: "toner",
    tags: ["texture", "acne", "oil", "pores"],
    why: "A cult daily exfoliating toner that combines AHA, BHA and PHA with 2% niacinamide and tea tree. One formula does the work of several acids, which is easier to control than stacking separate exfoliants.",
    ingredients: [
      { name: "AHA + BHA + PHA", function: "Surface and pore exfoliation at different depths" },
      { name: "Niacinamide 2%", function: "Oil and tone support" },
      { name: "Tea tree", function: "Traditional antibacterial/soothing extract" },
    ],
    evidence:
      "Salicylic acid is well established for comedonal acne, and AHAs improve texture and tone. Combining acids is not automatically better; frequency and tolerance matter more than the number of acids on the label.",
    bestFor: "Oily, texture-prone skin without a retinoid; not for a routine already using acids.",
    exfoliating: true,
  },
  {
    productId: "cosrx-advanced-snail-96-mucin-power-essence-skin",
    category: "toner",
    tags: ["hydration", "barrier", "redness", "aging"],
    why: "96% snail secretion filtrate in a lightweight gel that hydrates and supports the barrier after sun, actives or winter dryness. No fragrance or alcohol, and it layers under almost anything.",
    ingredients: [
      { name: "Snail secretion filtrate 96%", function: "Humectant glycoproteins for hydration and comfort" },
      { name: "Sodium hyaluronate", function: "Water-binding hydration" },
      { name: "Allantoin / panthenol", function: "Soothing and barrier support" },
    ],
    evidence:
      "Snail mucin is a humectant with glycoproteins and growth-factor-like peptides. Evidence is mostly small cosmetic studies, so treat it as barrier-friendly hydration rather than a drug or a retinoid replacement.",
    bestFor: "Dehydrated, irritated or post-active skin; layers well under moisturizer.",
  },
  {
    productId: "anua-azelaic-acid-10-hyaluron-redness-soothing-s",
    category: "serum",
    tags: ["redness", "acne", "brightening", "sensitivity"],
    why: "A 10% azelaic acid serum with hyaluronic acid for redness, post-acne marks and mild breakouts. Lightweight, unscented and much gentler than a high-strength retinoid.",
    ingredients: [
      { name: "Azelaic acid 10%", function: "Anti-inflammatory and pigment-cell support" },
      { name: "Hyaluronic acid", function: "Offsets the mild dryness azelaic acid can cause" },
    ],
    evidence:
      "Topical azelaic acid 10–20% is guideline-recognised for acne and rosacea, with anti-inflammatory and tyrosinase-inhibiting effects. It is generally better tolerated than high-strength retinoids.",
    bestFor: "Redness, rosacea-prone skin, post-acne marks and mild acne.",
  },
  {
    productId: "haruharu-wonder-rose-pdrn-soothing-serum-with-az",
    category: "serum",
    tags: ["redness", "sensitivity", "brightening", "barrier"],
    why: "A fragrance-free PDRN and azelaic acid serum aimed at red, reactive skin. Rose PDRN and azelaic acid calm visible redness while supporting a more even tone.",
    ingredients: [
      { name: "Rose PDRN", function: "Emerging repair and hydration ingredient" },
      { name: "Azelaic acid", function: "Reduces redness and post-inflammatory marks" },
      { name: "Bulgarian rose extract", function: "Soothing botanical support" },
    ],
    evidence:
      "Azelaic acid has solid clinical support for redness and pigmentation. PDRN is an emerging cosmetic ingredient with early repair data — promising, but not a replacement for proven actives.",
    bestFor: "Sensitive, redness-prone skin that finds vitamin C too stimulating.",
  },
  {
    productId: "arencia-vitamin-c-booster-shot-serum-30ml",
    category: "serum",
    tags: ["brightening", "aging", "texture"],
    why: "A Korean vitamin C booster that pairs brightening vitamin C with glutathione, niacinamide and vitamin E. A multi-antioxidant approach to dark spots, dullness and early fine lines.",
    ingredients: [
      { name: "Vitamin C", function: "Antioxidant and pigment-pathway support" },
      { name: "Glutathione", function: "Antioxidant that supports tone" },
      { name: "Niacinamide + vitamin E", function: "Barrier support and antioxidant recycling" },
    ],
    evidence:
      "L-ascorbic acid at roughly 10–20% has randomised trial support for pigmentation and photoaging. Glutathione and vitamin E can support antioxidant recycling, though formula stability is as important as the percentage.",
    bestFor: "Dullness, dark spots and early fine lines; introduce slowly if sensitive.",
    vitaminC: true,
  },
  {
    productId: "advanced-the-vitamin-c-23-serum-20ml-0-7oz",
    category: "serum",
    tags: ["brightening", "aging", "texture"],
    why: "A high-strength 23% vitamin C serum buffered with vitamin E and hyaluronic acid. It is for experienced antioxidant users chasing stubborn tone, not a first active.",
    ingredients: [
      { name: "Vitamin C 23%", function: "High-strength antioxidant and brightening" },
      { name: "Vitamin E", function: "Helps stabilise and recycle the antioxidant" },
      { name: "Hyaluronic acid", function: "Reduces the drying feel of high-strength vitamin C" },
    ],
    evidence:
      "High-concentration L-ascorbic acid is effective but more likely to sting; 10–15% is often enough. Use it in the morning under SPF and build up from every other day.",
    bestFor: "Experienced vitamin C users with dark spots or dullness; not for a first active.",
    vitaminC: true,
  },
  {
    productId: "medicube-deep-reviving-bakuchiol-retinol-facial-",
    category: "serum",
    tags: ["aging", "texture", "pores"],
    why: "A beginner-friendly evening serum pairing HPR/retinol with bakuchiol and collagen. The tube format makes a pea-sized dose easy to control, which is half the battle with retinoids.",
    ingredients: [
      { name: "HPR + retinol complex", function: "Retinoid signalling for fine lines and texture" },
      { name: "Bakuchiol", function: "Retinol-like botanical with less irritation in small studies" },
      { name: "Collagen complex", function: "Humectant support for a bouncy finish" },
    ],
    evidence:
      "Retinoids are the best-studied topical ingredients for photoaging. Bakuchiol has retinol-like effects in smaller studies with better tolerability. Start two to three nights a week, not nightly.",
    bestFor: "First-time retinoid users, normal to dry skin, fine lines and texture.",
    retinoid: true,
  },
  {
    productId: "cosrx-the-retinol-0-5-oil-20ml",
    category: "serum",
    tags: ["aging", "texture", "hydration"],
    why: "A 0.5% retinol oil for experienced users who already tolerate retinoids. The oil base cushions dryness, but this is a serious strength, not a starter.",
    ingredients: [
      { name: "Retinol 0.5%", function: "Accelerates turnover and supports collagen" },
      { name: "Plant oils", function: "Reduce the dry, tight feel of retinol" },
      { name: "Vitamin E", function: "Antioxidant support" },
    ],
    evidence:
      "Retinol has decades of clinical evidence for photoaging. Higher percentages increase irritation without a linear increase in benefit; 0.5% is a step up for experienced users only.",
    bestFor: "Experienced retinoid users with normal-to-dry skin and fine lines.",
    retinoid: true,
  },
  {
    productId: "beauty-of-joseon-glow-serum-propolis-niacinamide",
    category: "serum",
    tags: ["brightening", "pores", "oil", "redness"],
    why: "A 60% propolis serum with niacinamide and tea tree — a glossy, soothing layer for dullness, visible pores and post-blemish redness.",
    ingredients: [
      { name: "Propolis 60%", function: "Soothing, antioxidant-rich bee resin" },
      { name: "Niacinamide", function: "Tone and pore appearance" },
      { name: "Tea tree", function: "Traditional support for blemish-prone skin" },
    ],
    evidence:
      "Propolis is anti-inflammatory in lab and small clinical studies; niacinamide has stronger evidence for tone and barrier support. The honey-like texture suits drier skin better than oily skin.",
    bestFor: "Dull, uneven or blemish-prone skin that wants glow without strong acids.",
  },
  {
    productId: "purito-seoul-mighty-bamboo-panthenol-cream-barri",
    category: "moisturizer",
    tags: ["barrier", "hydration", "sensitivity", "redness"],
    why: "A fragrance-free gel-cream with 10% panthenol and bamboo extract for tight, wind-stressed skin. Light enough for morning, rich enough for winter.",
    ingredients: [
      { name: "Panthenol 10%", function: "Humectant and soothing support" },
      { name: "Bamboo extract", function: "Hydration and antioxidant support" },
      { name: "Glycerin", function: "Draws water into the upper layers" },
    ],
    evidence:
      "Panthenol is a well-tolerated humectant and soothing agent. Barrier creams that combine humectants with lipids are a first-line choice for dry, irritated skin.",
    bestFor: "Dry, tight or sensitive skin; a good buffer if you use retinoids.",
  },
  {
    productId: "aestura-atobarrier365-cream-available-as-single-",
    category: "moisturizer",
    tags: ["barrier", "hydration", "sensitivity", "aging"],
    why: "A ceramide barrier cream built around DermaON technology for dry, sensitive skin that reacts to weather and actives. A reliable nighttime buffer.",
    ingredients: [
      { name: "Ceramide complex", function: "Replenishes barrier lipids" },
      { name: "DermaON barrier lipids", function: "Ceramide/cholesterol/fatty-acid blend" },
      { name: "Glycerin", function: "Humectant hydration" },
    ],
    evidence:
      "Ceramides combined with cholesterol and fatty acids mimic the skin's lipid lamellae. Dermatologist consensus strongly supports this approach for barrier repair and dryness.",
    bestFor: "Very dry, sensitive or winter-stressed skin; nighttime barrier support.",
  },
  {
    productId: "dr-althea-345-relief-cream-mist-duo-korean-vegan",
    category: "moisturizer",
    tags: ["redness", "barrier", "acne", "sensitivity"],
    why: "A vegan centella, madecassoside, ceramide and panthenol set — cream plus mist — for redness and post-acne recovery without a greasy finish.",
    ingredients: [
      { name: "Centella / madecassoside", function: "Soothing support for redness" },
      { name: "Ceramide", function: "Barrier lipid support" },
      { name: "Panthenol", function: "Humectant and comfort" },
    ],
    evidence:
      "Centella and madecassoside have anti-inflammatory and wound-healing data, though smaller than retinoid evidence. Ceramides and panthenol support the barrier, making the pair a sensible post-active choice.",
    bestFor: "Sensitive, redness-prone or post-acne skin; convenient day/night pair.",
  },
  {
    productId: "haruharu-wonder-black-rice-moisture-airyfit-dail",
    category: "sunscreen",
    tags: ["sun", "hydration", "barrier", "sensitivity"],
    why: "A velvet-finish SPF50+ PA++++ with black rice and ceramide. It behaves like a moisturizing cream rather than a heavy sunscreen, which makes daily use realistic.",
    ingredients: [
      { name: "Black rice extract", function: "Antioxidant and hydration support" },
      { name: "Ceramide", function: "Barrier support under the UV filters" },
      { name: "Broad-spectrum UV filters", function: "SPF50+ PA++++ protection" },
    ],
    evidence:
      "Regular broad-spectrum sunscreen use is the most effective intervention against photoaging and pigment recurrence. SPF50+ PA++++ indicates high UVA and UVB protection when applied generously.",
    bestFor: "Normal-to-dry skin and winter days; layers well over moisturizer.",
  },
  {
    productId: "skin1004-madagascar-centella-hyalu-cica-water-fi",
    category: "sunscreen",
    tags: ["sun", "redness", "sensitivity", "hydration"],
    why: "A watery serum-textured SPF50+ PA++++ with centella and hyalu-cica, designed for reactive skin that dislikes thick sunscreen.",
    ingredients: [
      { name: "Centella asiatica", function: "Soothing support for reactive skin" },
      { name: "Hyaluronic acid", function: "Hydration in a watery base" },
      { name: "Broad-spectrum UV filters", function: "SPF50+ PA++++ protection" },
    ],
    evidence:
      "The UV protection is standardised; centella adds soothing support but does not replace filters. Reapply after sweating or two hours outdoors, and use enough product.",
    bestFor: "Sensitive, combination or dehydrated skin; a dewy finish.",
  },
  {
    productId: "purito-seoul-daily-soft-touch-sunscreen-spf50-pa",
    category: "sunscreen",
    tags: ["sun", "oil", "pores", "sensitivity"],
    why: "An oil-free, vegan SPF50+ PA++++ with five ceramides and a soft-touch finish. One of the lightest textures for people who normally avoid sunscreen.",
    ingredients: [
      { name: "Five ceramides", function: "Barrier support" },
      { name: "Broad-spectrum UV filters", function: "SPF50+ PA++++ protection" },
      { name: "Glycerin", function: "Light hydration without oil" },
    ],
    evidence:
      "Broad-spectrum SPF50+ is the benchmark for daily protection; the ceramides support the barrier, but the UV filters do the protective work. No sunscreen is truly matte forever — reapplication matters more than texture.",
    bestFor: "Oily, combination or normal skin; no white cast.",
  },
  {
    productId: "round-lab-birch-juice-moisturizing-uv-lock-spf-4",
    category: "sunscreen",
    tags: ["sun", "hydration", "sensitivity"],
    why: "A birch-sap SPF45 with a hydrating, no-white-cast finish for dry, sensitive skin that wants protection without richness.",
    ingredients: [
      { name: "Birch sap", function: "Humectant and soothing support" },
      { name: "Broad-spectrum UV filters", function: "SPF45 daily protection" },
      { name: "Glycerin", function: "Hydration" },
    ],
    evidence:
      "SPF45 with broad-spectrum filters is adequate for daily incidental exposure; reapply for prolonged outdoor time. Birch sap is a humectant, not a filter.",
    bestFor: "Dry or sensitive skin; cold-weather daily wear.",
  },
  {
    productId: "laneige-lip-sleeping-mask-ex-berry-overnight-hyd",
    category: "lip",
    tags: ["lips", "hydration", "barrier"],
    why: "An overnight lip mask with murumuru and shea butters plus vitamin C. It seals moisture on chapped lips better than a thin waxy balm alone.",
    ingredients: [
      { name: "Murumuru butter", function: "Occlusive moisture seal" },
      { name: "Shea butter", function: "Softens and reduces water loss" },
      { name: "Vitamin C", function: "Modest antioxidant support" },
    ],
    evidence:
      "Occlusive butters reduce transepidermal water loss on the lips, which have no sebaceous glands. Fragrance is present, so patch test if your lips are reactive.",
    bestFor: "Dry, flaky or winter-chapped lips; use as the last step at night.",
  },
  {
    productId: "biodance-hydro-cera-nol-real-deep-mask-hydrating",
    category: "mask",
    tags: ["hydration", "redness", "barrier", "sensitivity"],
    why: "An overnight hydrogel mask with ceramides and panthenol that turns clear as it delivers moisture. A useful reset after sun or actives.",
    ingredients: [
      { name: "Ceramides", function: "Barrier lipid support" },
      { name: "Panthenol", function: "Soothing hydration" },
      { name: "Hyaluronic acid", function: "Water-binding hydration" },
    ],
    evidence:
      "Hydrogel masks increase stratum corneum hydration transiently; ceramides and panthenol add barrier support. Think of it as a concentrated humectant treatment, not a permanent fix.",
    bestFor: "Dehydrated, redness-prone or post-sun skin; one to two times a week.",
  },
  {
    productId: "medicube-collagen-night-wrapping-mask-overnight-",
    category: "mask",
    tags: ["aging", "hydration", "barrier"],
    why: "A peel-off overnight wrapping mask with hydrolyzed collagen that locks in moisture and gives a temporary firm, glassy look.",
    ingredients: [
      { name: "Hydrolyzed collagen", function: "Humectant and film-forming support" },
      { name: "Glycerin", function: "Hydration" },
      { name: "Film-forming polymers", function: "Occlusive overnight seal" },
    ],
    evidence:
      "Topical collagen is a humectant and film-former, not a replacement for retinol. The occlusive layer reduces overnight water loss; expect temporary plumping rather than structural change.",
    bestFor: "Dry, dull or loss-of-firmness skin; a weekly or pre-event treatment.",
  },
  {
    productId: "cosrx-6x-peptide-collagen-skin-booster-toner-ser",
    category: "toner",
    tags: ["aging", "brightening", "barrier"],
    why: "A hybrid toner-serum with six peptides and copper peptide GHK-Cu for elasticity and dullness, in a lightweight layer that fits almost anywhere.",
    ingredients: [
      { name: "Six-peptide complex", function: "Firmness and barrier support" },
      { name: "GHK-Cu copper peptide", function: "In-vitro wound-healing and collagen signalling" },
      { name: "Niacinamide", function: "Tone support" },
    ],
    evidence:
      "Peptides have mixed but promising evidence for firmness and barrier support; GHK-Cu has in-vitro wound-healing data. They are gentler than retinoids but not equivalent in photoaging evidence.",
    bestFor: "Early firmness concerns or anyone who cannot tolerate retinoids.",
  },
  {
    productId: "medicube-pdrn-pink-peptide-serum-with-salmon-dna",
    category: "serum",
    tags: ["brightening", "aging", "hydration", "barrier"],
    why: "A pink glow serum with salmon DNA PDRN, peptides and niacinamide for hydration, firmness and uneven tone. A low-irritation option for skin that dislikes strong acids.",
    ingredients: [
      { name: "PDRN (salmon DNA)", function: "Emerging repair and hydration support" },
      { name: "Peptides", function: "Firmness and barrier support" },
      { name: "Niacinamide", function: "Tone and barrier support" },
    ],
    evidence:
      "Niacinamide and peptides have reasonable supporting data; PDRN is emerging. The combination is well tolerated and easy to layer under SPF, though it is not a substitute for a retinoid.",
    bestFor: "Dull, dehydrated or early-aging skin; a gentle alternative to strong actives.",
  },
  {
    productId: "beauty-of-joseon-revive-eye-serum-ginseng-retina",
    category: "serum",
    tags: ["aging", "brightening", "texture"],
    why: "Ginseng, retinal and niacinamide in a lightweight eye serum for fine lines, puffiness and dark circles. The eye area is thin, so a little goes a long way.",
    ingredients: [
      { name: "Ginseng root extract", function: "Antioxidant and circulation support" },
      { name: "Retinal", function: "Retinoid signalling for fine lines" },
      { name: "Niacinamide", function: "Tone support" },
    ],
    evidence:
      "Retinal is one step from retinoic acid and has good anti-aging support, though eye-area studies are smaller. Introduce it slowly and avoid layering with a second retinoid.",
    bestFor: "Fine lines and dark circles; not for a routine already using a strong retinoid.",
    retinoid: true,
  },
  {
    productId: "innisfree-retinol-cica-moisture-recovery-serum-3",
    category: "serum",
    tags: ["aging", "acne", "sensitivity", "barrier"],
    why: "A gentle retinol serum with salicylic acid and cica, positioned for oily, blemish-prone beginners who want anti-aging and texture support in one step.",
    ingredients: [
      { name: "Retinol", function: "Turnover and fine-line support" },
      { name: "Salicylic acid", function: "Pore and blemish support" },
      { name: "Jeju cica", function: "Soothing buffer" },
    ],
    evidence:
      "Retinol and salicylic acid both have solid evidence, but combining them can still irritate. Start twice weekly and buffer with moisturizer; do not add another exfoliant.",
    bestFor: "Oily, acne-prone first-retinol users; not for sensitive or already-exfoliating routines.",
    retinoid: true,
    exfoliating: true,
  },
  {
    productId: "i-m-from-rice-toner-glow-milky-rice-toner-with-n",
    category: "toner",
    tags: ["brightening", "hydration", "barrier"],
    why: "A milky rice toner with niacinamide that hydrates and adds glow without alcohol or fragrance. A comfortable layer for dry, dull skin.",
    ingredients: [
      { name: "Rice extract", function: "Traditional humectant and brightening extract" },
      { name: "Niacinamide", function: "Tone and barrier support" },
      { name: "Glycerin", function: "Hydration" },
    ],
    evidence:
      "Niacinamide at 2–5% has the strongest evidence here; rice extract is a traditional humectant. It is a good layering product, not a replacement for a dedicated treatment.",
    bestFor: "Dry, dull or dehydrated skin; all skin types.",
  },
]

function matchedReasons(
  knowledge: ProductKnowledge,
  concernSet: Set<ConcernKey>,
  gaps: Set<string>,
  barrierRisk: boolean,
  nightRoutine: boolean,
): string[] {
  const reasons: string[] = []

  if (knowledge.category === "sunscreen") {
    if (gaps.has("sun")) {
      reasons.push("Your routine has no sunscreen step")
    } else if (nightRoutine) {
      reasons.push("Save this for your morning SPF step")
    }
  }
  if (knowledge.category === "moisturizer" && gaps.has("moisturizer")) {
    reasons.push("No moisturizer in the routine yet")
  }
  if (knowledge.category === "cleanser" && gaps.has("cleanser")) {
    reasons.push("The routine has no cleanser")
  }
  if (barrierRisk && knowledge.tags.includes("barrier")) {
    reasons.push("Your actives raise barrier-support needs")
  }

  for (const tag of knowledge.tags) {
    if (!concernSet.has(tag)) continue
    const reason = CONCERN_REASON[tag]
    if (!reasons.includes(reason)) reasons.push(reason)
    if (reasons.length >= 3) break
  }

  if (reasons.length === 0) {
    reasons.push("A gentle, low-risk fit for most routines")
  }

  return reasons.slice(0, 2)
}

/**
 * Scores the curated products against the routine, then picks a diverse set:
 * one product per category and brand where possible, with fallbacks so the
 * section never ends up empty or repetitive.
 */
export function suggestProducts(
  products: Product[],
  analysis: RoutineAnalysis,
  limit = 4,
): RoutineProductSuggestion[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  const concernSet = new Set(analysis.concerns)

  const hasSunscreen = analysis.steps.some((step) => step.kind === "sunscreen")
  const hasMoisturizer = analysis.steps.some((step) => step.kind === "moisturize")
  const hasCleanser = analysis.steps.some((step) => step.kind === "cleanse")
  const hasRetinoid = analysis.steps.some((step) => step.actives.includes("retinoid"))
  const hasVitaminC = analysis.steps.some((step) => step.actives.includes("vitaminC"))
  const hasAcneActive = analysis.steps.some(
    (step) => step.actives.includes("bpo") || step.actives.includes("azelaic"),
  )
  const hasExfoliant = analysis.counts.exfoliants > 0
  const barrierRisk =
    analysis.counts.exfoliants >= 2 ||
    analysis.issues.some(
      (issue) =>
        issue.severity === "fix" &&
        (issue.id.includes("retinoid") || issue.id.includes("exfoliant") || issue.id.includes("overload")),
    )

  const gaps = new Set<string>()
  if (!hasSunscreen && !analysis.nightRoutine) gaps.add("sun")
  if (!hasMoisturizer) gaps.add("moisturizer")
  if (!hasCleanser) gaps.add("cleanser")

  const scored = PRODUCT_KNOWLEDGE.map((knowledge) => {
    const product = byId.get(knowledge.productId)
    if (!product) return null

    let score = 1
    for (const tag of knowledge.tags) {
      if (concernSet.has(tag)) score += 4
    }

    if (knowledge.category === "sunscreen") {
      score += hasSunscreen ? -8 : analysis.nightRoutine ? -6 : 7
    }
    if (knowledge.category === "moisturizer" && !hasMoisturizer) score += 5
    if (knowledge.category === "cleanser" && !hasCleanser) score += 4
    if (knowledge.category === "mask") score -= 2
    if (knowledge.category === "lip" && !concernSet.has("lips")) score -= 6

    // A dedicated acne treatment should beat general soothing products when
    // the routine is actively asking for one and does not already have it.
    if (concernSet.has("acne") && knowledge.tags.includes("acne") && !hasAcneActive) score += 4

    if (barrierRisk && knowledge.tags.includes("barrier")) score += 3
    if (knowledge.exfoliating) {
      if (hasExfoliant) score -= 10
      if (barrierRisk) score -= 5
      if (concernSet.has("sensitivity")) score -= 3
    }
    if (knowledge.retinoid && hasRetinoid) score -= 10
    if (knowledge.vitaminC && hasVitaminC) score -= 5

    score += product.bestseller ? 1 : 0
    score += (product.rating ?? 0) * 0.2
    if (product.price) score += 0.5

    return { product, knowledge, score }
  })
    .filter((entry): entry is { product: Product; knowledge: ProductKnowledge; score: number } =>
      Boolean(entry),
    )
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))

  const picked: typeof scored = []
  const usedCategories = new Set<SuggestionCategory>()
  const usedBrands = new Set<string>()

  const tryPick = (entry: (typeof scored)[number], enforceBrand: boolean) => {
    if (picked.length >= limit) return false
    if (usedCategories.has(entry.knowledge.category)) return false
    if (enforceBrand && usedBrands.has(entry.product.brand)) return false
    picked.push(entry)
    usedCategories.add(entry.knowledge.category)
    usedBrands.add(entry.product.brand)
    return true
  }

  for (const entry of scored) tryPick(entry, true)
  if (picked.length < 3) {
    for (const entry of scored) {
      if (picked.some((item) => item.product.id === entry.product.id)) continue
      tryPick(entry, false)
    }
  }
  if (picked.length < 3) {
    for (const entry of scored) {
      if (picked.some((item) => item.product.id === entry.product.id)) continue
      if (picked.length >= limit) break
      picked.push(entry)
      usedCategories.add(entry.knowledge.category)
    }
  }

  return picked.slice(0, limit).map((entry) => ({
    product: entry.product,
    knowledge: entry.knowledge,
    matchReasons: matchedReasons(
      entry.knowledge,
      concernSet,
      gaps,
      barrierRisk,
      analysis.nightRoutine,
    ),
  }))
}
