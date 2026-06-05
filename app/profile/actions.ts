'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { xpToNextLevel } from '@/lib/xp'

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
