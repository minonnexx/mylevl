'use server'

import { createClient } from '@/lib/supabase/server'
import { activateShield } from '@/lib/shields'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function activateShieldAction(): Promise<{ success: boolean; shieldsRemaining: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const result = await activateShield(supabase, user.id)

  if (result.success) {
    revalidatePath('/dashboard')
    revalidatePath('/profile')
  }

  return result
}
