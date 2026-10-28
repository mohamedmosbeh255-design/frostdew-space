"use client";

import { useState, type FormEvent } from "react";
import { Snowflake, Lock } from "lucide-react";
import { ADMIN_CONFIG, BRAND_CONFIG } from "@/config/store";
import SnowfallLayer from "@/components/winter/SnowfallLayer";

/* Admin login — liquid-glass card over the winter world (spec §49).
 * Single account; token persisted in localStorage; gentle shake on failure. */

export default function AdminLogin({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok =
      email.trim().toLowerCase() === ADMIN_CONFIG.email.toLowerCase() &&
      password === ADMIN_CONFIG.password;
    if (ok) {
      setError(false);
      onLogin(email.trim().toLowerCase());
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <SnowfallLayer density={0.4} />
      <form
        onSubmit={submit}
        className="glass-deep relative z-10 w-full max-w-sm rounded-[2rem] p-8 sm:p-10"
        aria-label="Admin login"
      >
        <div className="mb-8 text-center">
          <span className="glass-chip mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-glacier">
            <Snowflake className="h-7 w-7" strokeWidth={1.4} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl tracking-[0.18em] text-midnight">
            {BRAND_CONFIG.brandName}
          </h1>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.3em] text-glacier">
            Keeper&rsquo;s Cabin
          </p>
        </div>

        <label htmlFor="admin-email" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-winter">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          className="mb-4 w-full rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm text-midnight placeholder:text-muted-foreground/60 focus:border-glacier focus:outline-none"
          placeholder="you@example.com"
        />

        <label htmlFor="admin-password" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-winter">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className="w-full rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm text-midnight placeholder:text-muted-foreground/60 focus:border-glacier focus:outline-none"
          placeholder="••••••••••"
        />

        {error && (
          <p
            className="animate-shake mt-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-center text-sm font-semibold text-destructive"
            role="alert"
          >
            Invalid credentials
          </p>
        )}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-winter to-midnight px-6 py-3.5 text-sm font-bold tracking-wide text-snow shadow-lg shadow-winter/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-winter/40 active:translate-y-0"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Enter the cabin
        </button>

        <p className="mt-5 text-center text-[0.68rem] leading-relaxed text-muted-foreground">
          Private area for the {BRAND_CONFIG.brandName} keeper.
          <br />
          Visitors are welcome at <a href="/" className="underline decoration-glacier underline-offset-2">the storefront</a>.
        </p>
      </form>
    </div>
  );
}
