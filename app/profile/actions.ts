'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { xpToNextLevel } from '@/lib/xp'
import type { PackId } from '@/types/supabase'

export async function changeUsername(
  newUsername: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const clean = newUsername.trim().toLowerCase()
  if (!clean || clean.length < 3 || clean.length > 20) {
    return { error: 'El nombre debe tener entre 3 y 20 caracteres.' }
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    return { error: 'Solo letras, números y guiones bajos.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username_changed_at')
    .eq('id', user.id)
    .single()

  if (profile?.username_changed_at) {
    const availableAt = new Date(new Date(profile.username_changed_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    if (new Date() < availableAt) {
      return { error: `Disponible el ${availableAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.` }
    }
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', clean)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Ese nombre ya está en uso.' }

  const { error } = await supabase
    .from('profiles')
    .update({ username: clean, username_changed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo cambiar el nombre de usuario.' }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/missions')
}

export async function changeActivePack(
  pack: PackId,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('profiles')
    .update({ active_pack: pack })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo cambiar el pack. Inténtalo de nuevo.' }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/missions')
}

export async function resetProfileAction(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return

  // Auth check with the normal client (needs session cookies)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // All mutations via admin client to bypass RLS
  const admin = createAdminClient()

  const { count: deletedMissions } = await admin
    .from('completed_missions')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
  console.log('[reset] completed_missions eliminadas:', deletedMissions)

  const { count: deletedStreaks } = await admin
    .from('streaks')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
  console.log('[reset] streaks eliminadas:', deletedStreaks)

  const { count: updatedClass } = await admin
    .from('class_progress')
    .update({ points: 0 }, { count: 'exact' })
    .eq('user_id', user.id)
  console.log('[reset] class_progress actualizadas:', updatedClass)

  const { count: updatedProfile } = await admin
    .from('profiles')
    .update(
      {
        global_level:      1,
        current_xp:        0,
        xp_to_next_level:  xpToNextLevel(1),
        current_streak:    0,
        longest_streak:    0,
        total_days_active: 0,
      },
      { count: 'exact' },
    )
    .eq('id', user.id)
  console.log('[reset] profiles actualizadas:', updatedProfile)

  redirect('/dashboard')
}
