'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AvatarConfig } from '@/types/supabase'

export async function updateAvatarConfig(config: AvatarConfig): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_config: config })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/social')

  return { success: true }
}
