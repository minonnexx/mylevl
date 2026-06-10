'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchUser(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, username, global_level, current_streak, avatar_config, active_pack')
    .ilike('username', username)
    .neq('id', user.id)
    .maybeSingle()

  return data
}

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { count } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')

  if ((count ?? 0) >= 20) return { error: 'Límite de 20 amigos alcanzado' }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addresseeId })

  if (error) {
    if (error.code === '23505') return { error: 'La solicitud ya existe' }
    return { error: error.message }
  }

  return { success: true }
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  return error ? { error: error.message } : { success: true }
}

export async function rejectFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  return error ? { error: error.message } : { success: true }
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('status', 'accepted')

  return error ? { error: error.message } : { success: true }
}

export async function getFriends() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id')
    .eq('status', 'accepted')

  if (!friendships?.length) return []

  const friendIds = friendships.map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, global_level, current_streak, avatar_config, active_pack')
    .in('id', friendIds)

  return friendships.map(f => {
    const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
    const profile = profiles?.find(p => p.id === friendId)
    return {
      friendshipId: f.id as string,
      userId: friendId as string,
      username: (profile?.username ?? null) as string | null,
      global_level: (profile?.global_level ?? 1) as number,
      current_streak: (profile?.current_streak ?? 0) as number,
      avatar_config: (profile?.avatar_config ?? null) as import('@/types/supabase').AvatarConfig | null,
      active_pack: (profile?.active_pack ?? null) as import('@/types/supabase').PackId | null,
    }
  })
}

export async function getPendingRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, requester_id')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  if (!friendships?.length) return []

  const requesterIds = friendships.map(f => f.requester_id as string)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, global_level, avatar_config, active_pack')
    .in('id', requesterIds)

  return friendships.map(f => {
    const profile = profiles?.find(p => p.id === f.requester_id)
    return {
      friendshipId: f.id as string,
      userId: f.requester_id as string,
      username: (profile?.username ?? null) as string | null,
      global_level: (profile?.global_level ?? 1) as number,
      avatar_config: (profile?.avatar_config ?? null) as import('@/types/supabase').AvatarConfig | null,
      active_pack: (profile?.active_pack ?? null) as import('@/types/supabase').PackId | null,
    }
  })
}

export async function getFeed() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')

  const friendIds = (friendships ?? []).map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  const { data } = await supabase
    .from('social_feed')
    .select('id, user_id, event_type, metadata, created_at, profiles(username, global_level)')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}

export async function createLeague(name: string, invitedUserIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  if (!name.trim()) return { error: 'El nombre es obligatorio' }
  if (invitedUserIds.length === 0) return { error: 'Invita al menos a un jugador' }
  if (invitedUserIds.length > 9) return { error: 'Máximo 9 invitados (10 miembros en total)' }

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({ name: name.trim(), created_by: user.id })
    .select('id')
    .single()

  if (leagueError) return { error: leagueError.message }

  const members = [
    { league_id: league.id, user_id: user.id, status: 'accepted' },
    ...invitedUserIds.map(uid => ({ league_id: league.id, user_id: uid, status: 'pending' })),
  ]

  const { error: membersError } = await supabase
    .from('league_members')
    .insert(members)

  if (membersError) return { error: membersError.message }

  return { success: true, leagueId: league.id }
}

export async function respondToLeagueInvite(leagueMemberId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  if (accept) {
    const { error } = await supabase
      .from('league_members')
      .update({ status: 'accepted' })
      .eq('id', leagueMemberId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
    return error ? { error: error.message } : { success: true }
  } else {
    const { error } = await supabase
      .from('league_members')
      .delete()
      .eq('id', leagueMemberId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
    return error ? { error: error.message } : { success: true }
  }
}

export async function getMyLeagues() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: myMemberships } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  const leagueIds = (myMemberships ?? []).map(m => m.league_id as string)
  if (!leagueIds.length) return []

  const [leaguesRes, allMembersRes] = await Promise.all([
    supabase.from('leagues').select('id, name').in('id', leagueIds),
    supabase.from('league_members').select('league_id').in('league_id', leagueIds).eq('status', 'accepted'),
  ])

  return (leaguesRes.data ?? []).map(l => ({
    id: l.id as string,
    name: l.name as string,
    memberCount: (allMembersRes.data ?? []).filter(m => m.league_id === l.id).length,
  }))
}

export async function getPendingLeagueInvites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: invites } = await supabase
    .from('league_members')
    .select('id, league_id')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (!invites?.length) return []

  const leagueIds = invites.map(i => i.league_id as string)

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, created_by')
    .in('id', leagueIds)

  const creatorIds = [...new Set((leagues ?? []).map(l => l.created_by as string))]
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', creatorIds)

  return invites.map(inv => {
    const league = (leagues ?? []).find(l => l.id === inv.league_id)
    const creator = (creators ?? []).find(p => p.id === league?.created_by)
    return {
      leagueMemberId: inv.id as string,
      leagueId: inv.league_id as string,
      leagueName: (league?.name ?? 'Liga desconocida') as string,
      creatorUsername: (creator?.username ?? null) as string | null,
    }
  })
}

function getWeekStartISO(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString()
}

export type LeagueDetailMember = {
  userId: string
  username: string | null
  global_level: number
  avatar_config: import('@/types/supabase').AvatarConfig | null
  xp_earned: number
  missions_completed: number
}

export type LeagueDetail = {
  id: string
  name: string
  created_by: string
  currentUserId: string
  weekStart: string
  members: LeagueDetailMember[]
}

export async function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!membership) return null

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, created_by')
    .eq('id', leagueId)
    .single()

  if (!league) return null

  const { data: members } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
    .eq('status', 'accepted')

  const memberIds = (members ?? []).map(m => m.user_id as string)

  const [profilesRes, completionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, global_level, avatar_config')
      .in('id', memberIds),
    supabase
      .from('completed_missions')
      .select('user_id, mission_id')
      .in('user_id', memberIds)
      .gte('completed_at', getWeekStartISO()),
  ])

  const completions = completionsRes.data ?? []
  const missionIds = [...new Set(completions.map(c => c.mission_id as string))]

  let xpMap: Record<string, number> = {}
  if (missionIds.length > 0) {
    const { data: missionsData } = await supabase
      .from('missions')
      .select('id, xp_reward')
      .in('id', missionIds)
    xpMap = Object.fromEntries((missionsData ?? []).map(m => [m.id as string, m.xp_reward as number]))
  }

  const statsMap: Record<string, { xp: number; missions: number }> = {}
  for (const uid of memberIds) statsMap[uid] = { xp: 0, missions: 0 }
  for (const c of completions) {
    const uid = c.user_id as string
    if (statsMap[uid]) {
      statsMap[uid].missions++
      statsMap[uid].xp += xpMap[c.mission_id as string] ?? 0
    }
  }

  const rankedMembers: LeagueDetailMember[] = memberIds
    .map(uid => {
      const profile = (profilesRes.data ?? []).find(p => p.id === uid)
      return {
        userId: uid,
        username: (profile?.username ?? null) as string | null,
        global_level: (profile?.global_level ?? 1) as number,
        avatar_config: (profile?.avatar_config ?? null) as import('@/types/supabase').AvatarConfig | null,
        xp_earned: statsMap[uid]?.xp ?? 0,
        missions_completed: statsMap[uid]?.missions ?? 0,
      }
    })
    .sort((a, b) => {
      if (b.xp_earned !== a.xp_earned) return b.xp_earned - a.xp_earned
      return b.missions_completed - a.missions_completed
    })

  return {
    id: league.id as string,
    name: league.name as string,
    created_by: league.created_by as string,
    currentUserId: user.id,
    weekStart: getWeekStartISO(),
    members: rankedMembers,
  }
}

export async function leaveLeague(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: members } = await supabase
    .from('league_members')
    .select('id, user_id, joined_at')
    .eq('league_id', leagueId)
    .eq('status', 'accepted')
    .order('joined_at', { ascending: true })

  const otherMembers = (members ?? []).filter(m => m.user_id !== user.id)

  if (otherMembers.length === 0) {
    const { error } = await supabase.from('leagues').delete().eq('id', leagueId)
    return error ? { error: error.message } : { success: true }
  }

  const { data: league } = await supabase
    .from('leagues')
    .select('created_by')
    .eq('id', leagueId)
    .single()

  if ((league?.created_by as string) === user.id) {
    await supabase
      .from('leagues')
      .update({ created_by: otherMembers[0].user_id })
      .eq('id', leagueId)
  }

  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', user.id)

  return error ? { error: error.message } : { success: true }
}

export async function calculateLeagueStats(leagueId: string, weekStart: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)

  const { data: members } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
    .eq('status', 'accepted')

  const memberIds = (members ?? []).map(m => m.user_id as string)
  if (!memberIds.length) return { success: true }

  const { data: completions } = await supabase
    .from('completed_missions')
    .select('user_id, mission_id')
    .in('user_id', memberIds)
    .gte('completed_at', weekStart)
    .lt('completed_at', weekEnd.toISOString())

  const missionIds = [...new Set((completions ?? []).map(c => c.mission_id as string))]
  let xpMap: Record<string, number> = {}
  if (missionIds.length > 0) {
    const { data: missionsData } = await supabase
      .from('missions')
      .select('id, xp_reward')
      .in('id', missionIds)
    xpMap = Object.fromEntries((missionsData ?? []).map(m => [m.id as string, m.xp_reward as number]))
  }

  const statsMap: Record<string, { xp: number; missions: number }> = {}
  for (const uid of memberIds) statsMap[uid] = { xp: 0, missions: 0 }
  for (const c of completions ?? []) {
    const uid = c.user_id as string
    if (statsMap[uid]) {
      statsMap[uid].missions++
      statsMap[uid].xp += xpMap[c.mission_id as string] ?? 0
    }
  }

  const upserts = memberIds.map(uid => ({
    league_id: leagueId,
    user_id: uid,
    week_start: weekStart.slice(0, 10),
    xp_earned: statsMap[uid]?.xp ?? 0,
    missions_completed: statsMap[uid]?.missions ?? 0,
  }))

  const { error } = await supabase
    .from('league_weekly_stats')
    .upsert(upserts, { onConflict: 'league_id,user_id,week_start' })

  return error ? { error: error.message } : { success: true }
}

export async function toggleFeedPublic() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('feed_public')
    .eq('id', user.id)
    .single()

  const newValue = !((profile as { feed_public: boolean } | null)?.feed_public ?? true)

  await supabase
    .from('profiles')
    .update({ feed_public: newValue })
    .eq('id', user.id)

  return newValue
}
