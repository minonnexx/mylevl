'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(
  username: string,
  dateOfBirth: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Este nombre ya está en uso' }

  await supabase
    .from('profiles')
    .update({ username, onboarding_completed: true, date_of_birth: dateOfBirth })
    .eq('id', user.id)

  redirect('/dashboard')
}
