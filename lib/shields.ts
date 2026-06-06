import { SupabaseClient } from '@supabase/supabase-js'

export async function grantShieldIfEarned(
  supabase: SupabaseClient,
  userId: string,
  newStreak: number,
  currentShieldCount: number,
): Promise<boolean> {
  if (newStreak % 7 !== 0) return false
  if (currentShieldCount >= 3) return false

  const { error } = await supabase
    .from('profiles')
    .update({ shield_count: currentShieldCount + 1 })
    .eq('id', userId)

  return !error
}
