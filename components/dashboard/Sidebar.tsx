import { createClient } from '@/lib/supabase/server'
import SidebarClient from './SidebarClient'

export default async function Sidebar() {
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

  return <SidebarClient pendingCount={pendingCount} />
}
