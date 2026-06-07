'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm px-0 py-2 transition-opacity opacity-60 hover:opacity-100"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <LogOut size={15} aria-hidden />
      Cerrar sesión
    </button>
  )
}
