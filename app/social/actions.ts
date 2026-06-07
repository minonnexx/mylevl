'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchUser(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, username, global_level, current_streak')
    .eq('username', username)
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
    .select('id, username, global_level, current_streak')
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
    .select('id, username, global_level')
    .in('id', requesterIds)

  return friendships.map(f => {
    const profile = profiles?.find(p => p.id === f.requester_id)
    return {
      friendshipId: f.id as string,
      userId: f.requester_id as string,
      username: (profile?.username ?? null) as string | null,
      global_level: (profile?.global_level ?? 1) as number,
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

  const visibleUserIds = [user.id, ...friendIds]

  const { data } = await supabase
    .from('social_feed')
    .select('id, user_id, event_type, metadata, created_at, profiles(username, global_level)')
    .in('user_id', visibleUserIds)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
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
