'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Users } from 'lucide-react'
import { toast } from 'sonner'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { leaveLeague } from '@/app/social/actions'
import { LEAGUE_MOTIVATIONAL_MESSAGES } from '@/lib/constants/leagues'
import type { LeagueDetail, LeagueDetailMember } from '@/app/social/actions'

// Medal colors — purely data/decorative like rarity colors
const RANK_COLORS = {
  1: '#D4A843',
  2: '#9BA3AF',
  3: '#CD7F32',
} as const

function getRankColor(rank: number): string {
  return RANK_COLORS[rank as keyof typeof RANK_COLORS] ?? 'var(--color-text-muted)'
}

function getMotivationalKey(rank: number, total: number): keyof typeof LEAGUE_MOTIVATIONAL_MESSAGES {
  if (rank === 1) return 'top1'
  if (rank <= 3) return 'top3'
  if (rank === total) return 'last'
  return 'mid'
}

interface LeagueDetailViewProps {
  league: LeagueDetail
}

export function LeagueDetailView({ league }: LeagueDetailViewProps) {
  const { members, currentUserId } = league
  const myRank = members.findIndex(m => m.userId === currentUserId) + 1
  const motivationalKey = getMotivationalKey(myRank, members.length)
  const top3 = members.slice(0, 3)
  const rest = members.slice(3)

  return (
    <div className="flex flex-col gap-6">
      {/* Mensaje motivador */}
      {members.length > 1 && (
        <div
          className="rounded-card p-4 border border-border/40"
          style={{ background: 'var(--color-surface)' }}
        >
          <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            {LEAGUE_MOTIVATIONAL_MESSAGES[motivationalKey]}
          </p>
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
                <RankRow
                  key={member.userId}
                  member={member}
                  rank={rank}
                  isMe={isMe}
                />
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
      {/* Rank badge */}
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color }}
      >
        #{rank}
      </span>
      <AvatarDisplay config={member.avatar_config} size={avatarSize} />
      <div className="flex flex-col items-center gap-0.5 w-full min-w-0">
        <p className="text-xs font-semibold text-text-primary truncate w-full text-center">
          {member.username ?? 'jugador'}
        </p>
        <p className="text-xs tabular-nums font-bold" style={{ color }}>
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
        className="text-xs font-bold tabular-nums w-5 text-center flex-shrink-0"
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
      <div className="flex items-center gap-3 flex-shrink-0 text-right">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold tabular-nums text-text-primary">
            {member.xp_earned} XP
          </span>
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {member.missions_completed}m
          </span>
        </div>
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
        <span
          className="text-xs font-medium transition-transform"
          style={{
            color: 'var(--color-text-muted)',
            display: 'inline-block',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          ▾
        </span>
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
                <span className="flex-1 text-sm font-medium text-text-primary truncate">
                  {m.username ?? 'jugador'}
                  {isMe && (
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
                      (tú)
                    </span>
                  )}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-pill tabular-nums flex-shrink-0"
                  style={{
                    color: 'var(--color-accent)',
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                  }}
                >
                  LVL {m.global_level}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
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
