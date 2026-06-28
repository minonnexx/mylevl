'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { acceptFriendRequest, rejectFriendRequest } from '@/app/social/actions'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig, PackId } from '@/types/supabase'

type PendingRequest = {
  friendshipId: string
  userId: string
  username: string | null
  global_level: number
  avatar_config: AvatarConfig | null
  active_pack: PackId | null
}

export function PendingRequests({ requests }: { requests: PendingRequest[] }) {
  if (requests.length === 0) return null

  return (
    <div
      className="rounded-card p-6 border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={15} style={{ color: 'var(--color-accent)' }} aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">
          Solicitudes pendientes
        </h2>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-pill tabular-nums"
          style={{
            color: 'var(--color-accent)',
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
          }}
        >
          {requests.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {requests.map(req => (
          <RequestRow key={req.friendshipId} request={req} />
        ))}
      </div>
    </div>
  )
}

function RequestRow({ request }: { request: PendingRequest }) {
  const router = useRouter()
  const [isAccepting, startAccept] = useTransition()
  const [isRejecting, startReject] = useTransition()
  const isPending = isAccepting || isRejecting

  function handleAccept() {
    startAccept(async () => {
      const res = await acceptFriendRequest(request.friendshipId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(`Ahora eres amigo de ${request.username ?? 'jugador'}`)
        router.refresh()
      }
    })
  }

  function handleReject() {
    startReject(async () => {
      const res = await rejectFriendRequest(request.friendshipId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-component border border-border/40"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="flex-shrink-0">
        <AvatarDisplay config={request.avatar_config} size={32} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {request.username ?? 'jugador'}
        </p>
        <span
          className="text-xs font-black px-2 py-0.5 rounded-pill tabular-nums"
          style={{
            color: 'var(--color-accent)',
            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
          }}
        >
          LVL {request.global_level}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleAccept}
          disabled={isPending}
          aria-label={`Aceptar solicitud de ${request.username}`}
          className="flex items-center gap-1 h-8 px-3 rounded-component text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-fisico) 15%, transparent)',
            color: 'var(--color-fisico)',
            border: '1px solid color-mix(in srgb, var(--color-fisico) 25%, transparent)',
          }}
        >
          <Check size={12} aria-hidden />
          {isAccepting ? '...' : 'Aceptar'}
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          aria-label={`Rechazar solicitud de ${request.username}`}
          className="flex items-center gap-1 h-8 px-3 rounded-component text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
            color: 'var(--color-text-muted)',
            border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        >
          <X size={12} aria-hidden />
          {isRejecting ? '...' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}
