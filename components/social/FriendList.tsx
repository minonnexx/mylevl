'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserMinus, UserPlus, Flame, User } from 'lucide-react'
import { toast } from 'sonner'
import { removeFriend } from '@/app/social/actions'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig, PackId } from '@/types/supabase'

type Friend = {
  friendshipId: string
  userId: string
  username: string | null
  global_level: number
  current_streak: number
  avatar_config: AvatarConfig | null
  active_pack: PackId | null
}

export function FriendList({ friends }: { friends: Friend[] }) {
  return (
    <div
      className="rounded-card p-6 border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={15} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">
          Amigos ({friends.length}/20)
        </h2>
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <UserPlus size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <p className="text-base font-semibold text-text-primary">Aún no tienes compañeros</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Busca a alguien por su nombre de héroe y empieza tu aventura juntos
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {friends.map(f => (
            <FriendRow key={f.friendshipId} friend={f} />
          ))}
        </div>
      )}
    </div>
  )
}

function FriendRow({ friend }: { friend: Friend }) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isRemoving, startRemove] = useTransition()

  function handleRemove() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startRemove(async () => {
      const res = await removeFriend(friend.friendshipId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(`${friend.username ?? 'Jugador'} eliminado de amigos`)
        router.refresh()
      }
      setConfirmDelete(false)
    })
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-component border border-border/40"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="flex-shrink-0">
        <AvatarDisplay config={friend.avatar_config} size={32} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {friend.username ?? 'jugador'}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-pill tabular-nums"
            style={{
              color: 'var(--color-accent)',
              background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
            }}
          >
            LVL {friend.global_level}
          </span>
          {friend.current_streak > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Flame size={11} aria-hidden />
              {friend.current_streak}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!confirmDelete && (
          <button
            onClick={() => router.push(`/u/${friend.username}`)}
            aria-label={`Ver perfil de ${friend.username}`}
            className="h-7 w-7 flex items-center justify-center rounded-component transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <User size={14} aria-hidden />
          </button>
        )}
        {confirmDelete ? (
          <>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="h-7 px-2.5 rounded-component text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                background: 'color-mix(in srgb, #e53e3e 15%, transparent)',
                color: '#fc8181',
                border: '1px solid color-mix(in srgb, #e53e3e 25%, transparent)',
              }}
            >
              {isRemoving ? '...' : 'Sí, eliminar'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-2.5 rounded-component text-xs font-medium transition-colors"
              style={{
                color: 'var(--color-text-muted)',
                border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
              }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={`Eliminar a ${friend.username} de amigos`}
            className="h-7 w-7 flex items-center justify-center rounded-component transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <UserMinus size={14} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
