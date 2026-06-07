'use client'

import { useState, useTransition } from 'react'
import { Search, UserPlus, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { searchUser, sendFriendRequest } from '@/app/social/actions'

type SearchResult = {
  id: string
  username: string | null
  global_level: number
  current_streak: number
}

export function FriendSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null | undefined>(undefined)
  const [isSearching, startSearch] = useTransition()
  const [isSending, startSend] = useTransition()

  function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) return
    startSearch(async () => {
      const data = await searchUser(trimmed)
      setResult(data ?? null)
    })
  }

  function handleAddFriend(id: string) {
    startSend(async () => {
      const res = await sendFriendRequest(id)
      if ('error' in res) {
        const msg =
          res.error === 'La solicitud ya existe'
            ? 'Ya enviaste una solicitud a este jugador'
            : res.error
        toast.error(msg)
      } else {
        toast.success('Solicitud enviada')
        setQuery('')
        setResult(undefined)
      }
    })
  }

  return (
    <div
      className="rounded-card p-6 border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <h2 className="text-sm font-semibold text-text-primary mb-4">Buscar jugador</h2>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Username exacto..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-component border border-border/60 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
          }}
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Result */}
      {result === null && (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Usuario no encontrado
        </p>
      )}

      {result && (
        <div
          className="mt-4 flex items-center gap-3 p-4 rounded-component border border-border/60"
          style={{ background: 'var(--color-background)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {result.username ?? 'jugador'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-pill tabular-nums"
                style={{
                  color: 'var(--color-accent)',
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                }}
              >
                LVL {result.global_level}
              </span>
              {result.current_streak > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <Flame size={12} aria-hidden />
                  {result.current_streak}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleAddFriend(result.id)}
            disabled={isSending}
            aria-label={`Enviar solicitud a ${result.username}`}
            className="flex items-center gap-1.5 h-8 px-3 rounded-component text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
              color: 'var(--color-accent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
            }}
          >
            <UserPlus size={13} aria-hidden />
            {isSending ? 'Enviando...' : 'Añadir amigo'}
          </button>
        </div>
      )}
    </div>
  )
}
