import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase clients for server-side use only.
 *
 * - `getSupabasePublicClient()` uses the publishable/anon key and is subject to
 *   Row Level Security. Use it for public page reads.
 * - `getSupabaseAdminClient()` uses the secret/service-role key and bypasses
 *   RLS. Use it only inside authenticated admin API routes.
 *
 * The secret key must never be imported into a client component. The
 * `server-only` guard makes an accidental client import fail at build time.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim()
const SUPABASE_SECRET_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
)?.trim()

export class SupabaseConfigError extends Error {}

const serverAuthOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new SupabaseConfigError(
      `${name} is not set. Add it to .env.local and to the Vercel project environment variables.`,
    )
  }
  return value
}

let publicClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

/** True when the public URL and publishable key are both present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
}

/** Public read client. RLS applies, so it cannot modify protected tables. */
export function getSupabasePublicClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv(SUPABASE_PUBLISHABLE_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      serverAuthOptions,
    )
  }
  return publicClient
}

/** Service-role client for trusted server code. Never expose this to the browser. */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv(SUPABASE_SECRET_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
      serverAuthOptions,
    )
  }
  return adminClient
}
