import { createClient } from '@/lib/supabase/server'
import BottomNavClient from './BottomNavClient'

export default async function BottomNav() {
  const supabase = await createClient()
  let pendingCount = 0

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
      pendingCount = count ?? 0
    }
  } catch {
    pendingCount = 0
  }

  return <BottomNavClient pendingCount={pendingCount} />
}
