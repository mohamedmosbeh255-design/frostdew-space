"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

/* Shared admin form primitives — winter-consistent inputs with labels. */

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-winter">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm text-midnight placeholder:text-muted-foreground/60 focus:border-glacier focus:outline-none transition-colors";

export function SaveButton({ saving = false }: { saving?: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="rounded-xl bg-gradient-to-b from-winter to-midnight px-7 py-3 text-sm font-bold tracking-wide text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-winter/30 disabled:opacity-60"
    >
      Save changes
    </button>
  );
}

export function SavedIndicator({ show }: { show: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 text-sm font-bold text-glacier transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      Saved
    </span>
  );
}

export function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="glass-deep rounded-[1.75rem] p-6 sm:p-8">
      <h2 className="font-display text-2xl font-medium text-midnight">{title}</h2>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
