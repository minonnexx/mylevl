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
