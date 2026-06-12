'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export type AuthState = { error: string }

export async function authenticate(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const mode = formData.get('mode') as 'login' | 'signup'
  const identifier = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  if (mode === 'login') {
    let loginEmail = identifier

    if (!identifier.includes('@')) {
      const admin = createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .ilike('username', identifier)
        .single()

      if (!profile) return { error: 'Usuario o contraseña incorrectos' }

      const { data: userData } = await admin.auth.admin.getUserById(profile.id)
      if (!userData.user?.email) return { error: 'Usuario o contraseña incorrectos' }

      loginEmail = userData.user.email
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (error) return { error: 'Usuario o contraseña incorrectos' }
    redirect('/dashboard')
  } else {
    const inviteCode = formData.get('invite_code') as string
    const expectedCode = process.env.INVITE_CODE
    if (!expectedCode || inviteCode.trim() !== expectedCode.trim()) {
      return { error: 'Código de acceso incorrecto' }
    }

    const { error } = await supabase.auth.signUp({ email: identifier, password })
    if (error) return { error: error.message }
    redirect('/onboarding')
  }
}
