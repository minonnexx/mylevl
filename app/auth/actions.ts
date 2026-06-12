'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = { error: string }

export async function authenticate(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const mode = formData.get('mode') as 'login' | 'signup'
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  if (mode === 'login') {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    redirect('/dashboard')
  } else {
    const inviteCode = formData.get('invite_code') as string
    const expectedCode = process.env.INVITE_CODE
    if (!expectedCode || inviteCode.trim() !== expectedCode.trim()) {
      return { error: 'Código de acceso incorrecto' }
    }

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    redirect('/onboarding')
  }
}
