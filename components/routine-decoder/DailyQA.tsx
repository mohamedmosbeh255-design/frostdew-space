"use client"

import Link from "next/link"
import { ChevronDown, HelpCircle, MessageCircleQuestion, Sun } from "lucide-react"

type QA = {
  question: string
  answer: string[]
  tag: string
}

const QUESTIONS: QA[] = [
  {
    question: "Can I use vitamin C and niacinamide together?",
    tag: "Layering",
    answer: [
      "Yes. The old warning that they cancel each other out comes from unstable laboratory conditions, not from modern cosmetic formulas. Dermatologists routinely recommend both for uneven tone and barrier support.",
      "The practical caveat is irritation, not chemistry. High-strength L-ascorbic acid can sting on its own, so introduce vitamin C and niacinamide one at a time if your skin is reactive. A niacinamide serum layered after vitamin C is fine; no waiting period is required.",
    ],
  },
  {
    question: "How should I combine exfoliating acids and retinol?",
    tag: "Actives",
    answer: [
      "Alternate nights rather than layering them. Both accelerate skin turnover, and using an AHA, BHA or PHA on the same evening as a retinoid is one of the most common causes of stinging, peeling and a raw barrier.",
      "Start with one active two or three nights a week, use a plain moisturizer on the other nights, and wear sunscreen every morning. If you use prescription tretinoin, ask your clinician before adding any exfoliating acid.",
    ],
  },
  {
    question: "Does the order of my routine actually matter?",
    tag: "Order",
    answer: [
      "The general rule is thin to thick: cleanser, watery toners and essences, serums, moisturizer, then sunscreen in the morning. Actives need to go on before occlusive creams and oils so they can absorb evenly.",
      "You do not need to wait 20–30 minutes between every step. Wait only if a product pills or if your skin feels wet and tacky. Sunscreen is the exception: it should always be the final morning step, and it needs enough product to deliver its labelled SPF.",
    ],
  },
  {
    question: "How much sunscreen do I actually need?",
    tag: "SPF",
    answer: [
      "For the face and neck, aim for roughly a quarter teaspoon, or about two finger-lengths of product. Most people apply far less, which means the real-world protection is much lower than the label suggests.",
      "Choose broad-spectrum SPF 30–50+ with a PA rating for UVA, apply it as the last step of your morning routine, and reapply every two hours outdoors or after sweating. SPF in foundation or moisturizer is rarely enough on its own.",
    ],
  },
  {
    question: "Why does my skin sting or turn red after products?",
    tag: "Barrier",
    answer: [
      "A brief tingle from a strong acid can be normal; persistent stinging, heat or redness is a signal to stop. The usual causes are too many actives, a compromised barrier, or a product that does not agree with your skin.",
      "Pause exfoliants and retinoids for one to two weeks. Use a gentle cleanser, a fragrance-free moisturizer and sunscreen only. If the reaction is severe, spreading, or does not settle, see a board-certified dermatologist.",
    ],
  },
  {
    question: "Is double cleansing necessary?",
    tag: "Cleansing",
    answer: [
      "Not for everyone. It is most useful if you wear sunscreen, long-wear makeup or a lot of oil-based products. An oil cleanser or balm dissolves those, then a gentle water-based cleanser removes the residue.",
      "If your skin is dry or reactive, one gentle low-pH cleanser in the morning and a double cleanse only at night is often enough. Over-cleaning strips lipids and can make oiliness and sensitivity worse.",
    ],
  },
  {
    question: "Can I use retinol if I am pregnant or breastfeeding?",
    tag: "Safety",
    answer: [
      "Talk to your clinician before using any retinoid. Topical retinoids are generally avoided during pregnancy, and guidance around breastfeeding varies. This is a medical decision, not a cosmetic one.",
      "Do not substitute a random “pregnancy-safe” active without checking. Azelaic acid and some forms of vitamin C are often discussed as alternatives, but the right choice depends on your history and should be confirmed by your doctor.",
    ],
  },
  {
    question: "How many skincare steps do I really need?",
    tag: "Routine",
    answer: [
      "The core is simple: cleanser, moisturizer, and sunscreen in the morning. Everything else is optional and should earn its place by addressing a specific concern.",
      "A 10-step routine is not inherently better than a four-step one. More products mean more variables, more chance of irritation, and less consistency. If you want to add a treatment, add one at a time and give it four to six weeks.",
    ],
  },
  {
    question: "How long until I see results?",
    tag: "Expectations",
    answer: [
      "Hydration and comfort can improve within days. Uneven tone and post-acne marks usually need four to eight weeks of consistent use. Fine lines and firmness take eight to twelve weeks or longer, and retinoids can cause a temporary adjustment period.",
      "Photos are more reliable than memory: take one in similar lighting every two weeks. If a product causes persistent irritation, stop it rather than pushing through — “purging” is a real concept for retinoids and acids, but it should be mild and improve over time.",
    ],
  },
]

const FEATURED_TAG_STYLES: Record<string, string> = {
  Layering: "bg-ice text-winter",
  Actives: "bg-amber-100 text-amber-900",
  Order: "bg-emerald-100 text-emerald-900",
  SPF: "bg-amber-100 text-amber-900",
  Barrier: "bg-rose-100 text-rose-900",
  Cleansing: "bg-ice text-winter",
  Safety: "bg-winter/10 text-winter",
  Routine: "bg-emerald-100 text-emerald-900",
  Expectations: "bg-ice text-winter",
}

export default function DailyQA({ today }: { today: string }) {
  const seed = today.split("").reduce((total, character) => total + character.charCodeAt(0), 0)
  const featured = QUESTIONS[seed % QUESTIONS.length]
  const rest = QUESTIONS.filter((question) => question !== featured)

  return (
    <section id="daily-qa" aria-labelledby="daily-qa-title" className="scroll-mt-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-glacier">
            Daily Q&amp;A
          </p>
          <h2
            id="daily-qa-title"
            className="mt-1.5 font-display text-2xl font-medium text-midnight sm:text-3xl"
          >
            The questions that come up every day
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            One question rotates each day. The rest stay here, so you can check the short answer
            before you buy another bottle.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-glacier/40 bg-white px-3.5 py-2 text-xs font-bold text-winter transition-colors hover:bg-ice"
        >
          <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
          Ask a different question
        </Link>
      </div>

      <article className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-winter to-midnight p-5 text-white shadow-soft sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ice">
            <Sun className="h-3 w-3 text-amber-cta" aria-hidden="true" />
            Today&apos;s question
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ice/80">
            {featured.tag}
          </span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-medium leading-snug text-white sm:text-3xl">
          {featured.question}
        </h3>
        <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-ice/90 sm:text-[0.95rem]">
          {featured.answer.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
        {rest.map((question) => (
          <details
            key={question.question}
            className="group rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm transition-colors open:border-glacier/50 open:bg-white"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-start gap-2.5">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold leading-snug text-midnight">
                    {question.question}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] ${
                      FEATURED_TAG_STYLES[question.tag] ?? "bg-ice text-winter"
                    }`}
                  >
                    {question.tag}
                  </span>
                </span>
              </span>
              <ChevronDown
                className="mt-1 h-4 w-4 shrink-0 text-glacier transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <div className="mt-2 space-y-2 border-t border-border/70 pl-6 pt-2 text-sm leading-relaxed text-muted-foreground">
              {question.answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
