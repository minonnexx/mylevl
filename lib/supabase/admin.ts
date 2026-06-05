import { createClient } from '@supabase/supabase-js'

/**
 * Server-only admin client that bypasses RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Never import this file in client components.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
