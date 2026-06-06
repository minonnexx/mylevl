'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(username: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  await supabase
    .from('profiles')
    .update({ username, onboarding_completed: true })
    .eq('id', user.id)

  redirect('/dashboard')
}
