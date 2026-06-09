'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import AvatarCreator from '@/components/avatar/AvatarCreator'
import { updateAvatarConfig } from './actions'
import { createClient } from '@/lib/supabase/client'
import type { AvatarConfig } from '@/types/supabase'

export default function AvatarPage() {
  const router = useRouter()
  const [initialConfig, setInitialConfig] = useState<AvatarConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase
        .from('profiles')
        .select('avatar_config')
        .eq('id', user.id)
        .single()
      setInitialConfig((data?.avatar_config as AvatarConfig) ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleComplete(config: AvatarConfig) {
    await updateAvatarConfig(config)
    router.back()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <header
        className="flex items-center h-14 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex items-center justify-center w-8 h-8 rounded-component transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={18} aria-hidden />
        </button>
        <h1 className="flex-1 text-center text-sm font-semibold text-text-primary">
          Editar personaje
        </h1>
        <div className="w-8" aria-hidden />
      </header>

      <main className="flex-1 px-6 py-8 w-full max-w-sm mx-auto">
        {!loading && (
          <AvatarCreator
            onComplete={handleComplete}
            initialConfig={initialConfig}
          />
        )}
      </main>
    </div>
  )
}
