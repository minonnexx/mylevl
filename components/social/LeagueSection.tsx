'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { createLeague, respondToLeagueInvite } from '@/app/social/actions'
import { LEAGUE_PRESET_NAMES, LEAGUE_MAX_MEMBERS } from '@/lib/constants/leagues'
import type { AvatarConfig, PackId } from '@/types/supabase'

type MyLeague = {
  id: string
  name: string
  memberCount: number
}

type PendingLeagueInvite = {
  leagueMemberId: string
  leagueId: string
  leagueName: string
  creatorUsername: string | null
}

type Friend = {
  friendshipId: string
  userId: string
  username: string | null
  global_level: number
  current_streak: number
  avatar_config: AvatarConfig | null
  active_pack: PackId | null
}

interface LeagueSectionProps {
  myLeagues: MyLeague[]
  pendingLeagueInvites: PendingLeagueInvite[]
  friends: Friend[]
}

export function LeagueSection({ myLeagues, pendingLeagueInvites, friends }: LeagueSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div
      className="rounded-card p-6 border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={15} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <h2 className="text-sm font-semibold text-text-primary">Ligas</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="Crear nueva liga"
          className="flex items-center gap-1.5 h-8 px-3 rounded-component text-xs font-medium transition-colors min-w-[44px] min-h-[44px] justify-center"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            color: 'var(--color-accent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
          }}
        >
          <Plus size={13} aria-hidden />
          <span>Nueva liga</span>
        </button>
      </div>

      {/* Invitaciones pendientes */}
      {pendingLeagueInvites.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {pendingLeagueInvites.map(inv => (
            <LeagueInviteRow key={inv.leagueMemberId} invite={inv} />
          ))}
        </div>
      )}

      {/* Mis ligas */}
      {myLeagues.length === 0 && pendingLeagueInvites.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Shield size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <p className="text-base font-semibold text-text-primary">Aún no perteneces a ninguna liga</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Crea una liga e invita a tus compañeros a competir
          </p>
        </div>
      ) : (
        myLeagues.length > 0 && (
          <div className="flex flex-col gap-2">
            {myLeagues.map(league => (
              <LeagueRow key={league.id} league={league} />
            ))}
          </div>
        )
      )}

      {modalOpen && (
        <LeagueCreateModal
          friends={friends}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function LeagueRow({ league }: { league: MyLeague }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-component border border-border/40"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{league.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Users size={11} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {league.memberCount} {league.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
      </div>
    </div>
  )
}

function LeagueInviteRow({ invite }: { invite: PendingLeagueInvite }) {
  const router = useRouter()
  const [isAccepting, startAccept] = useTransition()
  const [isRejecting, startReject] = useTransition()
  const isPending = isAccepting || isRejecting

  function handleAccept() {
    startAccept(async () => {
      const res = await respondToLeagueInvite(invite.leagueMemberId, true)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(`Te has unido a ${invite.leagueName}`)
        router.refresh()
      }
    })
  }

  function handleReject() {
    startReject(async () => {
      const res = await respondToLeagueInvite(invite.leagueMemberId, false)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-component border"
      style={{
        background: 'var(--color-background)',
        borderColor: 'color-mix(in srgb, var(--color-disciplina) 25%, transparent)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{invite.leagueName}</p>
        {invite.creatorUsername && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Invitado por {invite.creatorUsername}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleAccept}
          disabled={isPending}
          aria-label={`Unirse a ${invite.leagueName}`}
          className="flex items-center gap-1 h-8 px-3 rounded-component text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-fisico) 15%, transparent)',
            color: 'var(--color-fisico)',
            border: '1px solid color-mix(in srgb, var(--color-fisico) 25%, transparent)',
          }}
        >
          <Check size={12} aria-hidden />
          {isAccepting ? '...' : 'Unirse'}
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          aria-label={`Rechazar invitación a ${invite.leagueName}`}
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

function LeagueCreateModal({ friends, onClose }: { friends: Friend[]; onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [isCreating, startCreate] = useTransition()
  const overlayRef = useRef<HTMLDivElement>(null)

  const maxInvites = LEAGUE_MAX_MEMBERS - 1
  const canCreate = name.trim().length > 0 && selectedFriendIds.length > 0 && !isCreating

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handlePresetClick(preset: string) {
    setName(preset)
  }

  function toggleFriend(userId: string) {
    setSelectedFriendIds(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId)
      if (prev.length >= maxInvites) return prev
      return [...prev, userId]
    })
  }

  function handleCreate() {
    if (!canCreate) return
    startCreate(async () => {
      const res = await createLeague(name, selectedFriendIds)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success('Liga creada')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-card border border-border/60 flex flex-col max-h-[90vh]"
        style={{ background: 'var(--color-surface)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Crear nueva liga"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
          <h2 className="text-base font-semibold text-text-primary">Nueva liga</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-component transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 min-h-0">

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Nombre de la liga
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre de tu liga..."
              maxLength={60}
              className="w-full h-10 px-3 text-sm rounded-component border border-border/60 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Nombres predefinidos */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              O elige un nombre predefinido
            </p>
            <div className="flex flex-wrap gap-2">
              {LEAGUE_PRESET_NAMES.map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1.5 rounded-pill text-xs font-medium transition-colors text-left"
                  style={
                    name === preset
                      ? {
                          background: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
                          color: 'var(--color-accent)',
                          border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
                        }
                      : {
                          background: 'color-mix(in srgb, var(--color-text-muted) 8%, transparent)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid color-mix(in srgb, var(--color-text-muted) 15%, transparent)',
                        }
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de amigos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Invitar amigos
              </p>
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-pill"
                style={{
                  color: selectedFriendIds.length >= maxInvites ? 'var(--color-disciplina)' : 'var(--color-text-muted)',
                  background: selectedFriendIds.length >= maxInvites
                    ? 'color-mix(in srgb, var(--color-disciplina) 12%, transparent)'
                    : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                }}
              >
                {selectedFriendIds.length}/{maxInvites} invitados
              </span>
            </div>

            {friends.length === 0 ? (
              <p className="text-sm py-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Añade amigos primero para poder invitarlos
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {friends.map(friend => {
                  const selected = selectedFriendIds.includes(friend.userId)
                  const disabled = !selected && selectedFriendIds.length >= maxInvites
                  return (
                    <button
                      key={friend.userId}
                      onClick={() => toggleFriend(friend.userId)}
                      disabled={disabled}
                      className="flex items-center gap-3 p-2.5 rounded-component border transition-colors text-left w-full min-h-[44px] disabled:opacity-40"
                      style={
                        selected
                          ? {
                              background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                              borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                            }
                          : {
                              background: 'var(--color-background)',
                              borderColor: 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)',
                            }
                      }
                    >
                      <AvatarDisplay config={friend.avatar_config} size={28} />
                      <span className="flex-1 text-sm font-medium text-text-primary truncate">
                        {friend.username ?? 'jugador'}
                      </span>
                      {selected && (
                        <Check size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border/40 flex-shrink-0">
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full h-10 rounded-component text-sm font-semibold transition-colors disabled:opacity-40"
            style={{
              background: canCreate
                ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
              color: canCreate ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: `1px solid ${canCreate
                ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)'}`,
            }}
          >
            {isCreating ? 'Creando...' : 'Crear liga'}
          </button>
        </div>
      </div>
    </div>
  )
}
