'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AvatarConfig, PackId } from '@/types/supabase'

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username)

  if (user) query.neq('id', user.id)

  const { data } = await query.maybeSingle()
  return { available: data === null }
}

export async function completeOnboarding(
  username: string,
  dateOfBirth: string,
  activePack: PackId,
  avatarConfig: AvatarConfig | null,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('username_changed_at')
    .eq('id', user.id)
    .single()

  if (currentProfile?.username_changed_at) {
    const changedAt = new Date(currentProfile.username_changed_at)
    const daysSince = (Date.now() - changedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 30) return { error: 'Solo puedes cambiar tu nombre de usuario una vez cada 30 días' }
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Este nombre ya está en uso' }

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username,
      onboarding_completed: true,
      date_of_birth: dateOfBirth,
      username_changed_at: new Date().toISOString(),
      active_pack: activePack,
      avatar_config: avatarConfig,
    })

  redirect('/dashboard')
}
