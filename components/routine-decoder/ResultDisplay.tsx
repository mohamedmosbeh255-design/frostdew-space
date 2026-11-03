"use client"

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Sparkles,
  XCircle,
} from "lucide-react"
import {
  ACTIVE_LABELS,
  CONCERN_LABELS,
  scoreVerdict,
  severityLabel,
  type RoutineAnalysis,
  type RoutineCategory,
  type RoutineIssue,
  type RoutineSeverity,
} from "@/lib/routine-analysis"

const CATEGORY_LABELS: Record<RoutineCategory, string> = {
  order: "Application order",
  compatibility: "Ingredient mix",
  ph: "pH & layering",
  steps: "Step count",
}

const SEVERITY_STYLES: Record<
  RoutineSeverity,
  {
    icon: typeof CheckCircle2
    iconClass: string
    border: string
    background: string
    title: string
    text: string
    chip: string
  }
> = {
  fix: {
    icon: XCircle,
    iconClass: "text-rose-600",
    border: "border-rose-200",
    background: "bg-rose-50/80",
    title: "text-rose-950",
    text: "text-rose-900/80",
    chip: "bg-rose-100 text-rose-800",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    border: "border-amber-200",
    background: "bg-amber-50/80",
    title: "text-amber-950",
    text: "text-amber-900/80",
    chip: "bg-amber-100 text-amber-800",
  },
  good: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    border: "border-emerald-200",
    background: "bg-emerald-50/70",
    title: "text-emerald-950",
    text: "text-emerald-900/80",
    chip: "bg-emerald-100 text-emerald-800",
  },
}

const SEVERITY_ORDER: RoutineSeverity[] = ["fix", "warning", "good"]

const SEVERITY_HEADINGS: Record<RoutineSeverity, { title: string; note: string }> = {
  fix: { title: "Fix first", note: "These are the changes most likely to change how your skin feels." },
  warning: { title: "Worth watching", note: "Not urgent, but worth simplifying or splitting up." },
  good: { title: "Working well", note: "Keep these habits — they are doing real work." },
}

const GAUGE_COLORS: Record<RoutineSeverity, string> = {
  good: "#059669",
  warning: "#d97706",
  fix: "#be123c",
}

function scoreTone(score: number): RoutineSeverity {
  const verdict = scoreVerdict(score)
  if (verdict.tone === "good") return "good"
  return score < 50 ? "fix" : "warning"
}

function ScoreGauge({ score }: { score: number }) {
  const tone = scoreTone(score)
  const verdict = scoreVerdict(score)
  const circumference = 2 * Math.PI * 52
  const filled = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          viewBox="0 0 120 120"
          className="h-36 w-36 -rotate-90 sm:h-40 sm:w-40"
          role="img"
          aria-label={`Routine health score: ${score} out of 100. ${verdict.label}.`}
        >
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e4edf5" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={GAUGE_COLORS[tone]}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-medium text-midnight">{score}</span>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <p className="text-sm font-bold text-midnight">{verdict.label}</p>
    </div>
  )
}

function Breakdown({ analysis }: { analysis: RoutineAnalysis }) {
  const categories = Object.keys(CATEGORY_LABELS) as RoutineCategory[]

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {categories.map((category) => {
        const value = analysis.breakdown[category]
        const bar =
          value >= 20 ? "bg-emerald-500" : value >= 12 ? "bg-amber-500" : "bg-rose-500"
        return (
          <div key={category} className="rounded-2xl border border-border bg-white/80 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-winter">
                {CATEGORY_LABELS[category]}
              </p>
              <span className="text-xs font-bold text-midnight">{value}/25</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-ice"
              role="progressbar"
              aria-label={`${CATEGORY_LABELS[category]} score`}
              aria-valuemin={0}
              aria-valuemax={25}
              aria-valuenow={value}
            >
              <div
                className={`h-full rounded-full ${bar} transition-[width] duration-700 motion-reduce:transition-none`}
                style={{ width: `${(value / 25) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IssueCard({ issue }: { issue: RoutineIssue }) {
  const style = SEVERITY_STYLES[issue.severity]
  const Icon = style.icon

  return (
    <article className={`rounded-2xl border ${style.border} ${style.background} p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-display text-base font-semibold leading-snug ${style.title}`}>
              {issue.title}
            </h4>
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] ${style.chip}`}>
              {severityLabel(issue.severity)}
            </span>
          </div>
          <p className={`mt-1.5 text-sm leading-relaxed ${style.text}`}>{issue.detail}</p>
          <p className={`mt-3 flex items-start gap-1.5 text-sm font-semibold ${style.title}`}>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="sr-only">Suggested fix: </span>
              {issue.fix}
            </span>
          </p>
        </div>
      </div>
    </article>
  )
}

function DetectedSteps({ analysis }: { analysis: RoutineAnalysis }) {
  return (
    <div className="rounded-3xl border border-border bg-white/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-medium text-midnight">How we read your routine</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysis.counts.steps} steps · {analysis.counts.actives} active families ·{" "}
            {analysis.counts.exfoliants} exfoliating product
            {analysis.counts.exfoliants === 1 ? "" : "s"}
          </p>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Steps are inferred from product and ingredient names. Check the full INCI if you are
          unsure about a formula.
        </p>
      </div>

      <ol className="mt-4 space-y-2">
        {analysis.steps.map((step, index) => (
          <li
            key={`${index}-${step.line}`}
            className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-white px-3.5 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ice text-xs font-bold text-winter">
                {index + 1}
              </span>
              <span className="rounded-full border border-glacier/30 bg-snow px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-winter">
                {step.label}
              </span>
            </div>
            <p className="min-w-0 flex-1 text-sm font-medium text-midnight">{step.line}</p>
            {step.actives.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:justify-end">
                {step.actives.slice(0, 4).map((active) => (
                  <span
                    key={active}
                    className="rounded-full bg-ice/80 px-2 py-0.5 text-[0.62rem] font-semibold text-winter"
                  >
                    {ACTIVE_LABELS[active]}
                  </span>
                ))}
                {step.actives.length > 4 && (
                  <span className="rounded-full bg-ice/80 px-2 py-0.5 text-[0.62rem] font-semibold text-winter">
                    +{step.actives.length - 4}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function ResultDisplay({ analysis }: { analysis: RoutineAnalysis }) {
  const issuesBySeverity = SEVERITY_ORDER.map((severity) => ({
    severity,
    issues: analysis.issues.filter((issue) => issue.severity === severity),
  })).filter((group) => group.issues.length > 0)

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-white via-snow to-ice/50 p-5 shadow-soft sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <ScoreGauge score={analysis.score} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-winter shadow-sm">
                <Sparkles className="h-3 w-3 text-amber-cta" aria-hidden="true" />
                Routine report
              </span>
              {analysis.nightRoutine && (
                <span className="rounded-full bg-winter/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-winter">
                  Evening routine
                </span>
              )}
            </div>
            <p className="mt-3 font-display text-xl font-medium leading-snug text-midnight sm:text-2xl">
              {analysis.summary}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {analysis.concerns.map((concern) => (
                <span
                  key={concern}
                  className="rounded-full border border-glacier/25 bg-white/70 px-2.5 py-1 text-xs font-semibold text-winter"
                >
                  {CONCERN_LABELS[concern]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Breakdown analysis={analysis} />
        </div>
      </section>

      {issuesBySeverity.map((group) => (
        <section key={group.severity}>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-display text-xl font-medium text-midnight">
              {SEVERITY_HEADINGS[group.severity].title}
              <span className="ml-2 align-middle text-sm font-sans font-semibold text-muted-foreground">
                {group.issues.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">{SEVERITY_HEADINGS[group.severity].note}</p>
          </div>
          <div className="space-y-2.5">
            {group.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      ))}

      <DetectedSteps analysis={analysis} />

      <p className="flex items-start gap-2 rounded-2xl border border-dashed border-border bg-white/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-glacier" aria-hidden="true" />
        The score is a teaching aid built from generic dermatology rules of thumb. It cannot see
        your skin, your prescriptions or the full formula of each product.
      </p>
    </div>
  )
}
