'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserMinus, UserCheck, UserX, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '@/app/social/actions'

export type FriendshipState =
  | { type: 'none'; profileId: string }
  | { type: 'pending_sent'; friendshipId: string }
  | { type: 'pending_received'; friendshipId: string }
  | { type: 'friends'; friendshipId: string }

export function FriendshipButton({ state }: { state: FriendshipState }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (state.type === 'none') {
    return (
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await sendFriendRequest(state.profileId)
            if ('error' in res) {
              toast.error(res.error === 'La solicitud ya existe'
                ? 'Ya enviaste una solicitud a este jugador'
                : res.error)
            } else {
              toast.success('Solicitud enviada')
              router.refresh()
            }
          })
        }
        className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
        style={{
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
        }}
      >
        <UserPlus size={14} aria-hidden />
        {isPending ? 'Enviando...' : 'Añadir amigo'}
      </button>
    )
  }

  if (state.type === 'pending_sent') {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium opacity-50 cursor-not-allowed"
        style={{
          color: 'var(--color-text-muted)',
          border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
        }}
      >
        <Clock size={14} aria-hidden />
        Solicitud enviada
      </button>
    )
  }

  if (state.type === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await acceptFriendRequest(state.friendshipId)
              if ('error' in res) {
                toast.error(res.error)
              } else {
                toast.success('Solicitud aceptada')
                router.refresh()
              }
            })
          }
          className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-fisico) 12%, transparent)',
            color: 'var(--color-fisico)',
            border: '1px solid color-mix(in srgb, var(--color-fisico) 20%, transparent)',
          }}
        >
          <UserCheck size={14} aria-hidden />
          Aceptar
        </button>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await rejectFriendRequest(state.friendshipId)
              if ('error' in res) {
                toast.error(res.error)
              } else {
                toast.success('Solicitud rechazada')
                router.refresh()
              }
            })
          }
          className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        >
          <UserX size={14} aria-hidden />
          Rechazar
        </button>
      </div>
    )
  }

  // friends
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await removeFriend(state.friendshipId)
          if ('error' in res) {
            toast.error(res.error)
          } else {
            toast.success('Amigo eliminado')
            router.refresh()
          }
        })
      }
      className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
      style={{
        color: 'var(--color-text-muted)',
        border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
      }}
    >
      <UserMinus size={14} aria-hidden />
      {isPending ? 'Eliminando...' : 'Eliminar amigo'}
    </button>
  )
}
