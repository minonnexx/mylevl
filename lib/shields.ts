import { SupabaseClient } from '@supabase/supabase-js'

export async function grantShieldIfEarned(
  supabase: SupabaseClient,
  userId: string,
  newStreak: number,
): Promise<boolean> {
  if (newStreak % 7 !== 0) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('shield_count')
    .eq('id', userId)
    .single()

  const current = (profile?.shield_count as number) ?? 0
  if (current >= 3) return false

  const { error } = await supabase
    .from('profiles')
    .update({ shield_count: current + 1 })
    .eq('id', userId)

  return !error
}

export async function activateShield(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean; shieldsRemaining: number }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('shield_count, shield_active')
    .eq('id', userId)
    .single()

  const current = (profile?.shield_count as number) ?? 0
  if (!profile || current <= 0) return { success: false, shieldsRemaining: 0 }

  const newCount = current - 1
  const { error } = await supabase
    .from('profiles')
    .update({ shield_count: newCount, shield_active: true })
    .eq('id', userId)

  if (error) return { success: false, shieldsRemaining: current }
  return { success: true, shieldsRemaining: newCount }
}
