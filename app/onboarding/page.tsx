import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed || profile?.username) {
    redirect('/dashboard')
  }

  return <OnboardingFlow />
}
