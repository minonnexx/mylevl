'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Users, ChevronLeft, ChevronDown, UserPlus, UserCheck, Check, X, Swords } from 'lucide-react'
import { toast } from 'sonner'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { leaveLeague, inviteToLeague, sendFriendRequest } from '@/app/social/actions'
import { LEAGUE_MOTIVATIONAL_MESSAGES, LEAGUE_MAX_MEMBERS } from '@/lib/constants/leagues'
import type { LeagueDetail, LeagueDetailMember, InvitableFriend } from '@/app/social/actions'

// Medal colors — purely data/decorative like rarity colors
const RANK_COLORS = {
  1: '#D4A843',
  2: '#9BA3AF',
  3: '#CD7F32',
} as const

function getRankColor(rank: number): string {
  return RANK_COLORS[rank as keyof typeof RANK_COLORS] ?? 'var(--color-text-muted)'
}

function getMotivationalKey(
  members: LeagueDetailMember[],
  currentUserId: string,
): 'top1' | 'top2' | 'top3' | 'mid' | 'last' {
  const me = members.find(m => m.userId === currentUserId)
  if (!me) return 'mid'

  // Competition rank: 1 + number of members with strictly better score
  const rank = 1 + members.filter(m =>
    m.xp_earned > me.xp_earned ||
    (m.xp_earned === me.xp_earned && m.missions_completed > me.missions_completed)
  ).length

  // Last: no member has a strictly worse score (and there are other members)
  const isLast = members.length > 1 && !members.some(m =>
    m.xp_earned < me.xp_earned ||
    (m.xp_earned === me.xp_earned && m.missions_completed < me.missions_completed)
  )

  if (rank === 1) return 'top1'
  if (rank === 2) return 'top2'
  if (rank === 3) return 'top3'
  if (isLast) return 'last'
  return 'mid'
}

interface LeagueDetailViewProps {
  league: LeagueDetail
}

export function LeagueDetailView({ league }: LeagueDetailViewProps) {
  const { members, currentUserId, totalMembersCount, invitableFriends } = league
  const motivationalKey = getMotivationalKey(members, currentUserId)
  const top3 = members.slice(0, 3)
  const rest = members.slice(3)
  const isFull = totalMembersCount >= LEAGUE_MAX_MEMBERS
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/social"
          aria-label="Volver a social"
          className="flex items-center justify-center w-9 h-9 rounded-component transition-colors hover:bg-surface-elevated flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary truncate flex-1 min-w-0">
          {league.name}
        </h1>
        {isFull ? (
          <span
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-pill"
            style={{
              color: 'var(--color-text-muted)',
              border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
            }}
          >
            Liga completa
          </span>
        ) : (
          <button
            onClick={() => setInviteModalOpen(true)}
            aria-label="Invitar jugadores a la liga"
            className="flex items-center gap-1.5 h-9 px-3 rounded-component text-xs font-medium transition-colors flex-shrink-0 min-w-[44px]"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
            }}
          >
            <UserPlus size={13} aria-hidden />
            <span>Invitar</span>
          </button>
        )}
      </div>

      {/* Mensaje motivador */}
      {members.length > 1 && (
        <div
          className="rounded-card p-4 border border-border/40"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))',
            borderLeftColor: 'var(--color-accent)',
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex items-start gap-3">
            <Swords size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} aria-hidden />
            <p className="text-sm text-text-primary font-medium italic">
              {LEAGUE_MOTIVATIONAL_MESSAGES[motivationalKey]}
            </p>
          </div>
        </div>
      )}

      {/* Top 3 podio */}
      <div
        className="rounded-card p-6 border border-border/60"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-sm font-semibold text-text-primary">Ranking semanal</h2>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            · esta semana
          </span>
        </div>

        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 mb-6">
            {/* Podio: 2º - 1º - 3º */}
            {[
              top3[1] ?? null,
              top3[0] ?? null,
              top3[2] ?? null,
            ].map((member, idx) => {
              if (!member) return <div key={idx} className="flex-1 max-w-[100px]" />
              const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3
              const isFirst = rank === 1
              const isMe = member.userId === currentUserId
              const color = getRankColor(rank)
              return (
                <PodiumCard
                  key={member.userId}
                  member={member}
                  rank={rank}
                  isFirst={isFirst}
                  isMe={isMe}
                  color={color}
                />
              )
            })}
          </div>
        )}

        {/* Resto del ranking */}
        {rest.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {rest.map((member, idx) => {
              const rank = idx + 4
              const isMe = member.userId === currentUserId
              return (
                <RankRow key={member.userId} member={member} rank={rank} isMe={isMe} />
              )
            })}
          </div>
        )}

        {members.length === 1 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
            Tú eres el único miembro. Invita a alguien para empezar a competir.
          </p>
        )}
      </div>

      {/* Lista de miembros */}
      <MembersList members={members} currentUserId={currentUserId} />

      {/* Salir de la liga */}
      <LeaveButton leagueId={league.id} leagueName={league.name} />

      {/* Modal de invitar */}
      {inviteModalOpen && (
        <InviteModal
          leagueId={league.id}
          invitableFriends={invitableFriends}
          slotsAvailable={LEAGUE_MAX_MEMBERS - totalMembersCount}
          onClose={() => setInviteModalOpen(false)}
        />
      )}
    </div>
  )
}

function PodiumCard({
  member,
  rank,
  isFirst,
  isMe,
  color,
}: {
  member: LeagueDetailMember
  rank: number
  isFirst: boolean
  isMe: boolean
  color: string
}) {
  const avatarSize = isFirst ? 44 : 36
  return (
    <div
      className={`flex-1 max-w-[110px] flex flex-col items-center gap-2 p-3 rounded-card border transition-colors ${isFirst ? 'pb-4' : ''}`}
      style={{
        background: isMe
          ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-background))'
          : 'var(--color-background)',
        borderColor: isMe
          ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)'
          : 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)',
      }}
    >
      <span className="text-xs font-black tabular-nums" style={{ color }}>
        #{rank}
      </span>
      <AvatarDisplay config={member.avatar_config} size={avatarSize} />
      <div className="flex flex-col items-center gap-0.5 w-full min-w-0">
        <p className="text-xs font-semibold text-text-primary truncate w-full text-center">
          {member.username ?? 'jugador'}
        </p>
        <p className="text-xs tabular-nums font-black" style={{ color: 'var(--color-accent)' }}>
          {member.xp_earned} XP
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {member.missions_completed} {member.missions_completed === 1 ? 'misión' : 'misiones'}
        </p>
      </div>
    </div>
  )
}

function RankRow({
  member,
  rank,
  isMe,
}: {
  member: LeagueDetailMember
  rank: number
  isMe: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-component border min-h-[44px]"
      style={{
        background: isMe
          ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-background))'
          : 'var(--color-background)',
        borderColor: isMe
          ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)'
          : 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)',
      }}
    >
      <span
        className="text-xs font-black tabular-nums w-5 text-center flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {rank}
      </span>
      <AvatarDisplay config={member.avatar_config} size={28} />
      <span className="flex-1 text-sm font-medium text-text-primary truncate min-w-0">
        {member.username ?? 'jugador'}
        {isMe && (
          <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
            (tú)
          </span>
        )}
      </span>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-xs font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
          {member.xp_earned} XP
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {member.missions_completed}m
        </span>
      </div>
    </div>
  )
}

function MembersList({
  members,
  currentUserId,
}: {
  members: LeagueDetailMember[]
  currentUserId: string
}) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div
      className="rounded-card border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between p-6 min-h-[44px]"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Users size={15} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <span className="text-sm font-semibold text-text-primary">
            Miembros ({members.length})
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-muted)',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 150ms',
            flexShrink: 0,
          }}
          aria-hidden
        />
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 flex flex-col gap-2">
          {members.map(m => {
            const isMe = m.userId === currentUserId
            return (
              <div
                key={m.userId}
                className="flex items-center gap-3 p-2.5 rounded-component border min-h-[44px]"
                style={{
                  background: isMe
                    ? 'color-mix(in srgb, var(--color-accent) 6%, var(--color-background))'
                    : 'var(--color-background)',
                  borderColor: 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)',
                }}
              >
                <AvatarDisplay config={m.avatar_config} size={28} />
                <span className="flex-1 text-sm font-medium text-text-primary truncate min-w-0">
                  {m.username ?? 'jugador'}
                  {isMe && (
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
                      (tú)
                    </span>
                  )}
                </span>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-pill tabular-nums flex-shrink-0"
                  style={{
                    color: 'var(--color-accent)',
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                  }}
                >
                  LVL {m.global_level}
                </span>
                {!isMe && (
                  <AddFriendButton
                    userId={m.userId}
                    username={m.username}
                    initialStatus={m.friendshipStatus}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddFriendButton({
  userId,
  username,
  initialStatus,
}: {
  userId: string
  username: string | null
  initialStatus: 'friend' | 'pending' | 'none'
}) {
  const [status, setStatus] = useState<'friend' | 'pending' | 'none'>(initialStatus)
  const [isPending, startTransition] = useTransition()

  if (status === 'friend') return null

  if (status === 'pending') {
    return (
      <button
        disabled
        aria-label="Solicitud pendiente"
        className="flex items-center justify-center w-9 h-9 rounded-component flex-shrink-0"
        style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
      >
        <UserCheck size={14} aria-hidden />
      </button>
    )
  }

  function handleAdd() {
    startTransition(async () => {
      const res = await sendFriendRequest(userId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        setStatus('pending')
      }
    })
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isPending}
      aria-label={`Añadir a ${username ?? 'jugador'} como amigo`}
      className="flex items-center justify-center w-9 h-9 rounded-component transition-colors flex-shrink-0 disabled:opacity-40"
      style={{
        color: 'var(--color-accent)',
        border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
      }}
    >
      <UserPlus size={14} aria-hidden />
    </button>
  )
}

function LeaveButton({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isLeaving, startLeave] = useTransition()

  function handleLeave() {
    startLeave(async () => {
      const res = await leaveLeague(leagueId)
      if ('error' in res) {
        toast.error(res.error)
        setConfirm(false)
      } else {
        toast.success(`Has salido de ${leagueName}`)
        router.push('/social')
      }
    })
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-component text-sm font-medium transition-colors self-start min-w-[44px]"
        style={{
          color: 'var(--color-text-muted)',
          border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
        }}
      >
        <LogOut size={14} aria-hidden />
        Salir de la liga
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        ¿Seguro que quieres salir?
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className="h-9 px-4 rounded-component text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'color-mix(in srgb, var(--color-error, #e05252) 15%, transparent)',
            color: 'var(--color-error, #e05252)',
            border: '1px solid color-mix(in srgb, var(--color-error, #e05252) 25%, transparent)',
          }}
        >
          {isLeaving ? '...' : 'Sí, salir'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="h-9 px-4 rounded-component text-sm font-medium transition-colors"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function InviteModal({
  leagueId,
  invitableFriends,
  slotsAvailable,
  onClose,
}: {
  leagueId: string
  invitableFriends: InvitableFriend[]
  slotsAvailable: number
  onClose: () => void
}) {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSending, startSend] = useTransition()

  const canSend = selectedIds.length > 0 && !isSending

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function toggleFriend(userId: string) {
    setSelectedIds(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId)
      if (prev.length >= slotsAvailable) return prev
      return [...prev, userId]
    })
  }

  function handleSend() {
    if (!canSend) return
    startSend(async () => {
      const res = await inviteToLeague(leagueId, selectedIds)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        const n = selectedIds.length
        toast.success(`${n} invitación${n === 1 ? '' : 'es'} enviada${n === 1 ? '' : 's'}`)
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
        aria-label="Invitar jugadores"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-text-primary">Invitar jugadores</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {slotsAvailable} {slotsAvailable === 1 ? 'plaza disponible' : 'plazas disponibles'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-component transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {invitableFriends.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              Todos tus amigos ya están en esta liga o no tienes amigos aún
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Tus amigos
                </p>
                <span
                  className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-pill"
                  style={{
                    color: selectedIds.length >= slotsAvailable && slotsAvailable > 0
                      ? 'var(--color-disciplina)'
                      : 'var(--color-text-muted)',
                    background: selectedIds.length >= slotsAvailable && slotsAvailable > 0
                      ? 'color-mix(in srgb, var(--color-disciplina) 12%, transparent)'
                      : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                  }}
                >
                  {selectedIds.length} invitados
                </span>
              </div>
              {invitableFriends.map(friend => {
                const selected = selectedIds.includes(friend.userId)
                const disabled = !selected && selectedIds.length >= slotsAvailable
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
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text-primary truncate block">
                        {friend.username ?? 'jugador'}
                      </span>
                      <span
                        className="text-xs tabular-nums font-bold"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        LVL {friend.global_level}
                      </span>
                    </div>
                    {selected && (
                      <Check size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border/40 flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full h-10 rounded-component text-sm font-semibold transition-colors disabled:opacity-40"
            style={{
              background: canSend
                ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
              color: canSend ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: `1px solid ${canSend
                ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)'}`,
            }}
          >
            {isSending ? 'Enviando...' : 'Enviar invitaciones'}
          </button>
        </div>
      </div>
    </div>
  )
}
