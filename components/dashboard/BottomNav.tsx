import { createClient } from '@/lib/supabase/server'
import BottomNavClient from './BottomNavClient'

export default async function BottomNav() {
  const supabase = await createClient()
  let pendingFriendCount = 0
  let pendingLeagueCount = 0

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [friendRes, leagueRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('addressee_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
      ])
      pendingFriendCount = friendRes.count ?? 0
      pendingLeagueCount = leagueRes.count ?? 0
    }
  } catch {
    pendingFriendCount = 0
    pendingLeagueCount = 0
  }

  return <BottomNavClient pendingFriendCount={pendingFriendCount} pendingLeagueCount={pendingLeagueCount} />
}
