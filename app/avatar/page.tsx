import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvatarPageClient from './AvatarPageClient'
import type { AvatarConfig } from '@/types/supabase'

export default async function AvatarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data } = await supabase
    .from('profiles')
    .select('avatar_config')
    .eq('id', user.id)
    .single()

  const initialConfig = (data?.avatar_config as AvatarConfig) ?? null

  return <AvatarPageClient initialConfig={initialConfig} />
}
