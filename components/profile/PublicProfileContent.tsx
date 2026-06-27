'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trophy, X, Check, Eye, EyeOff, Zap } from 'lucide-react'
import { HexMedal } from '@/components/ui/HexMedal'
import { MedalDetailModal } from '@/components/ui/MedalDetailModal'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { updatePublicProfileSettings } from '@/app/profile/actions'
import { CLASS_META, getMilestoneProgress, getClassMilestone } from '@/lib/constants/classes'
import { FriendshipButton } from '@/components/social/FriendshipButton'
import type { FriendshipState } from '@/components/social/FriendshipButton'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig, LifeClass, Medal } from '@/types/supabase'

const LIFE_CLASSES: LifeClass[] = ['fisico', 'mental', 'disciplina']

const CLASS_GLOW: Record<LifeClass, string> = {
  fisico:     'rgba(29,158,117,0.28)',
  mental:     'rgba(127,119,221,0.28)',
  disciplina: 'rgba(186,117,23,0.28)',
}

interface ProfileData {
  username: string
  global_level: number
  current_streak: number
  avatar_config: AvatarConfig | null
  profile_show_medals: boolean
  pinned_medals: string[]
}

interface Props {
  isOwner: boolean
  profile: ProfileData
  classPoints: Record<string, number>
  earnedMedals: Medal[]
  friendshipState: FriendshipState | null
}

export function PublicProfileContent({
  isOwner,
  profile,
  classPoints,
  earnedMedals,
  friendshipState,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [showMedals, setShowMedals] = useState(profile.profile_show_medals)
  const [pinnedIds, setPinnedIds] = useState<string[]>(profile.pinned_medals ?? [])
  const [selectedMedal, setSelectedMedal] = useState<Medal | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const pinnedMedals = pinnedIds
    .map(id => earnedMedals.find(m => m.id === id))
    .filter((m): m is Medal => Boolean(m))

  // Dominant class for avatar ring
  const dominantClass = LIFE_CLASSES.reduce<LifeClass | null>((best, lc) => {
    const pts = classPoints[lc] ?? 0
    if (pts === 0) return best
    if (!best) return lc
    return pts > (classPoints[best] ?? 0) ? lc : best
  }, null)
  const showRing = profile.avatar_config?.style === 'adventurer'
  const ringColor = dominantClass ? CLASS_META[dominantClass].color : 'var(--color-accent)'
  const glowRgba  = dominantClass ? CLASS_GLOW[dominantClass] : 'rgba(127,119,221,0.25)'

  const isActiveStreak = profile.current_streak > 0

  function handleTogglePin(medal: Medal) {
    setPinnedIds(prev => {
      if (prev.includes(medal.id)) return prev.filter(id => id !== medal.id)
      if (prev.length >= 3) return prev
      return [...prev, medal.id]
    })
  }

  function handleCancel() {
    setShowMedals(profile.profile_show_medals)
    setPinnedIds(profile.pinned_medals ?? [])
    setSaveError(null)
    setEditing(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await updatePublicProfileSettings(showMedals, pinnedIds, profile.username)
      if (result?.error) {
        setSaveError(result.error)
        return
      }
      setEditing(false)
    })
  }

  return (
    <>
      {selectedMedal && (
        <MedalDetailModal medal={selectedMedal} onClose={() => setSelectedMedal(null)} />
      )}

      {/* Avatar + name header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">

          {/* Avatar with conditional ring */}
          <div className="relative flex-shrink-0">
            <AvatarDisplay config={profile.avatar_config} size={80} />
            {showRing && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${ringColor} 45%, transparent), 0 0 16px ${glowRgba}`,
                }}
                aria-hidden
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-text-primary leading-tight">
              {profile.username}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-black tabular-nums px-2 py-0.5 rounded-pill"
                style={{
                  color: 'var(--color-accent)',
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)',
                }}
              >
                LVL {profile.global_level}
              </span>
              {isActiveStreak && (
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill"
                  style={{
                    color: 'var(--color-disciplina)',
                    background: 'color-mix(in srgb, var(--color-disciplina) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-disciplina) 22%, transparent)',
                  }}
                >
                  <Zap size={10} strokeWidth={2.5} aria-hidden />
                  <span className="font-black tabular-nums">{profile.current_streak}</span>
                  <span>días</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit / friendship button */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {friendshipState && <FriendshipButton state={friendshipState} />}
          {isOwner && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
              }}
            >
              <Pencil size={13} aria-hidden />
              Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* Class life section */}
      <div
        className="rounded-card p-6 border border-border/60 flex flex-col gap-4"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Section header inline */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
          <div className="h-[2px] w-5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} aria-hidden />
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
            Clases de vida
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {LIFE_CLASSES.map((lc, idx) => {
            const meta   = CLASS_META[lc]
            const points = classPoints[lc] ?? 0
            const { title, pct } = getMilestoneProgress(points)

            return (
              <div key={lc} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-text-primary">{meta.label}</span>
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-pill ${meta.badgeClasses}`}>
                    {title}
                  </span>
                  <span className="ml-auto text-[10px] tabular-nums text-text-muted flex-shrink-0">
                    {points} pts
                  </span>
                </div>
                <AnimatedBar
                  value={pct / 100}
                  color={meta.color}
                  glowColor={CLASS_GLOW[lc]}
                  height="h-1.5"
                  delay={idx * 0.1}
                  aria-label={`${meta.label}: ${points} puntos, ${title}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Medals section — edit mode */}
      {isOwner && editing && (
        <div
          className="rounded-card border border-border/60 p-6 flex flex-col gap-5"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-[2px] w-5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-disciplina)' }} aria-hidden />
              <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Medallas</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-3 rounded-component text-xs font-medium transition-colors"
                style={{
                  background: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
                }}
              >
                <X size={12} aria-hidden />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-3 rounded-component text-xs font-medium transition-colors"
                style={{
                  background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                }}
              >
                <Check size={12} aria-hidden />
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>

          {saveError && (
            <p className="text-xs" style={{ color: 'var(--color-disciplina)' }}>{saveError}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-text-primary">Mostrar medallas en el perfil</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Si está desactivado, la sección de medallas no será visible
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showMedals}
              onClick={() => setShowMedals(v => !v)}
              className="relative flex-shrink-0 w-10 h-6 rounded-pill transition-colors"
              style={{
                background: showMedals
                  ? 'var(--color-accent)'
                  : 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  left: showMedals ? 'calc(100% - 22px)' : '2px',
                  background: 'var(--color-text-primary)',
                }}
              />
            </button>
          </div>

          {showMedals && earnedMedals.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Medallas fijadas</span>
                <span
                  className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-pill"
                  style={{
                    color: pinnedIds.length >= 3 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    background: pinnedIds.length >= 3
                      ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
                      : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                  }}
                >
                  {pinnedIds.length}/3
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Selecciona hasta 3 medallas para destacar en tu perfil
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {earnedMedals.map(medal => {
                  const isPinned    = pinnedIds.includes(medal.id)
                  const isDisabled  = !isPinned && pinnedIds.length >= 3
                  return (
                    <button
                      key={medal.id}
                      type="button"
                      onClick={() => !isDisabled && handleTogglePin(medal)}
                      disabled={isDisabled}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-component transition-colors relative"
                      title={medal.name}
                      aria-label={`${isPinned ? 'Quitar' : 'Fijar'} medalla ${medal.name}`}
                      style={{
                        border: isPinned
                          ? '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)'
                          : '1px solid transparent',
                        background: isPinned
                          ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
                          : 'transparent',
                        opacity: isDisabled ? 0.4 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isPinned && (
                        <span
                          className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--color-accent)' }}
                        >
                          <Check size={8} strokeWidth={3} style={{ color: 'var(--color-background)' }} />
                        </span>
                      )}
                      <HexMedal size={32} icon={medal.icon} rarity={medal.rarity} />
                      <span className="text-[10px] text-center leading-tight truncate w-full" style={{ color: 'var(--color-text-muted)' }}>
                        {medal.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {showMedals && earnedMedals.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Aún no tienes medallas desbloqueadas
            </p>
          )}
        </div>
      )}

      {/* Medals section — view mode */}
      {(!isOwner || !editing) && showMedals && (
        <div
          className="rounded-card border border-border/60 p-6 flex flex-col gap-5"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-[2px] w-5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-disciplina)' }} aria-hidden />
              <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Medallas</h2>
            </div>
            {isOwner && !editing && (
              <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <Eye size={13} aria-hidden />
                <span className="text-xs">Visible</span>
              </div>
            )}
          </div>

          {earnedMedals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Este jugador aún no tiene medallas
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {pinnedMedals.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Destacadas
                  </p>
                  <div className="flex gap-5 flex-wrap">
                    {pinnedMedals.map(medal => (
                      <button
                        key={medal.id}
                        type="button"
                        onClick={() => setSelectedMedal(medal)}
                        className="flex flex-col items-center gap-2 cursor-pointer"
                        title={medal.name}
                        aria-label={`Ver detalle de medalla: ${medal.name}`}
                        style={{ background: 'none', border: 'none', padding: 0, minWidth: 56 }}
                      >
                        <HexMedal size={56} icon={medal.icon} rarity={medal.rarity} />
                        <span className="text-xs text-center leading-tight" style={{ color: 'var(--color-text-muted)', maxWidth: 72 }}>
                          {medal.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  {earnedMedals.length > pinnedMedals.length && (
                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4 }} />
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {earnedMedals.map(medal => (
                  <button
                    key={medal.id}
                    type="button"
                    onClick={() => setSelectedMedal(medal)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                    title={medal.name}
                    aria-label={`Ver detalle de medalla: ${medal.name}`}
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <HexMedal size={36} icon={medal.icon} rarity={medal.rarity} />
                    <span className="text-[10px] text-center leading-tight truncate w-full" style={{ color: 'var(--color-text-muted)' }}>
                      {medal.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medals hidden indicator — owner only */}
      {(!isOwner || !editing) && !showMedals && isOwner && (
        <div
          className="rounded-card border border-border/60 p-4 flex items-center gap-3"
          style={{ background: 'var(--color-surface)' }}
        >
          <EyeOff size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            La sección de medallas está oculta en tu perfil público
          </p>
        </div>
      )}
    </>
  )
}
