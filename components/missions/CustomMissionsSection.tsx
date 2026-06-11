'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { CLASS_META } from '@/lib/constants/classes'
import type { LifeClass, CustomMission, CustomMissionDifficulty, CustomMissionDuration } from '@/types/supabase'
import { createCustomMissionAction, deleteCustomMissionAction } from '@/app/missions/actions'

type CustomMissionWithCompletion = CustomMission & { completed_today: boolean }

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<CustomMissionDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
}

const DIFF_BADGE_CLASS: Record<CustomMissionDifficulty, string> = {
  easy: 'text-fisico bg-fisico/8 border-fisico/20',
  medium: 'text-disciplina bg-disciplina/8 border-disciplina/20',
  hard: 'text-error bg-error/8 border-error/20',
}

const XP_BY_DIFF: Record<CustomMissionDifficulty, number> = { easy: 10, medium: 20, hard: 40 }

const DURATION_LABELS: { value: CustomMissionDuration; label: string }[] = [
  { value: '7',          label: '7 días'    },
  { value: '30',         label: '30 días'   },
  { value: '90',         label: '90 días'   },
  { value: 'indefinido', label: 'Indefinido' },
]

// ─── Badge helpers ────────────────────────────────────────────────────────────

function ClassBadge({ lifeClass }: { lifeClass: LifeClass }) {
  const m = CLASS_META[lifeClass]
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${m.badgeClasses}`}>
      {m.label}
    </span>
  )
}

function DiffBadge({ difficulty }: { difficulty: CustomMissionDifficulty }) {
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-pill border ${DIFF_BADGE_CLASS[difficulty]}`}>
      {DIFF_LABEL[difficulty]}
    </span>
  )
}

// ─── Custom mission card ──────────────────────────────────────────────────────

function CustomMissionCard({
  mission,
  onDelete,
  isDeleting,
}: {
  mission: CustomMissionWithCompletion
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const classMeta = CLASS_META[mission.life_class]

  return (
    <article
      className="bg-surface rounded-card rounded-l-none border border-l-0 border-border/60 p-4 flex flex-col gap-3 h-full"
      style={{ borderLeft: `3px solid ${classMeta.borderColor}` }}
      aria-label={mission.title}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <ClassBadge lifeClass={mission.life_class} />
        <DiffBadge difficulty={mission.difficulty} />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-text-primary leading-snug flex-1">{mission.title}</p>

      {/* XP */}
      <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
        +{mission.xp_reward} XP
      </span>

      {/* Ends at */}
      {mission.ends_at && (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Hasta{' '}
          {new Date(mission.ends_at + 'T00:00:00').toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      )}

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { onDelete(mission.id); setConfirmDelete(false) }}
            disabled={isDeleting}
            className="flex-1 h-9 text-xs font-semibold rounded-component disabled:opacity-40"
            style={{ background: 'var(--color-error)', color: 'white' }}
          >
            {isDeleting ? 'Eliminando...' : 'Confirmar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="flex-1 h-9 text-xs rounded-component border border-border/60"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 h-9 px-3 w-full text-xs rounded-component border border-border/60 hover:border-error/40 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={`Eliminar misión ${mission.title}`}
        >
          <Trash2 size={12} aria-hidden />
          Eliminar
        </button>
      )}
    </article>
  )
}

// ─── Create mission modal ─────────────────────────────────────────────────────

function CreateMissionModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [lifeClass, setLifeClass] = useState<LifeClass | null>(null)
  const [difficulty, setDifficulty] = useState<CustomMissionDifficulty | null>(null)
  const [duration, setDuration] = useState<CustomMissionDuration>('30')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canCreate = title.trim().length > 0 && lifeClass !== null && difficulty !== null

  function handleCreate() {
    if (!canCreate || !lifeClass || !difficulty) return
    setFormError(null)
    startTransition(async () => {
      const result = await createCustomMissionAction({
        title: title.trim(),
        life_class: lifeClass,
        difficulty,
        duration,
      })
      if (result.error) {
        setFormError(result.error)
      } else {
        toast('Misión creada', { description: `+${XP_BY_DIFF[difficulty]} XP por completarla`, duration: 3000 })
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Crear misión personalizada"
    >
      <div
        className="w-full max-w-md bg-surface rounded-card border border-border/60 p-6 flex flex-col gap-5"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Nueva misión</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-component transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Título
          </label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 50))}
            placeholder="Ej: Meditar 20 minutos"
            maxLength={50}
            className="h-11 px-3 rounded-component border border-border/60 bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
          />
          <span className="text-xs self-end tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {title.length}/50
          </span>
        </div>

        {/* Class selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Categoría
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['fisico', 'mental', 'disciplina'] as LifeClass[]).map(cls => {
              const m = CLASS_META[cls]
              const selected = lifeClass === cls
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setLifeClass(cls)}
                  aria-pressed={selected}
                  className="h-11 rounded-component text-sm font-semibold border transition-all"
                  style={selected ? {
                    background: `color-mix(in srgb, ${m.color} 15%, transparent)`,
                    borderColor: m.color,
                    color: m.color,
                  } : {
                    background: 'transparent',
                    borderColor: 'color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Dificultad
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as CustomMissionDifficulty[]).map(diff => {
              const selected = difficulty === diff
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  aria-pressed={selected}
                  className="h-11 rounded-component text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all"
                  style={selected ? {
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  } : {
                    background: 'transparent',
                    borderColor: 'color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span>{DIFF_LABEL[diff]}</span>
                  <span className="opacity-70" style={{ fontSize: '10px' }}>+{XP_BY_DIFF[diff]} XP</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Duración
          </label>
          <div className="flex gap-2 flex-wrap">
            {DURATION_LABELS.map(({ value, label }) => {
              const selected = duration === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDuration(value)}
                  aria-pressed={selected}
                  className="h-9 px-4 rounded-pill text-sm font-medium border transition-all"
                  style={selected ? {
                    background: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                    color: 'white',
                  } : {
                    background: 'transparent',
                    borderColor: 'color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Error message */}
        {formError && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{formError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-component text-sm border border-border/60 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate || isPending}
            className="flex-1 h-11 rounded-component text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-accent)', color: 'white' }}
          >
            {isPending ? 'Creando...' : 'Crear misión'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function CustomMissionsSection({
  customMissions,
}: {
  customMissions: CustomMissionWithCompletion[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startDeleteTransition] = useTransition()

  const hasReachedLimit = customMissions.length >= 1

  const handleClose = useCallback(() => setModalOpen(false), [])

  function handleDelete(id: string) {
    setDeletingId(id)
    startDeleteTransition(async () => {
      const result = await deleteCustomMissionAction(id)
      setDeletingId(null)
      if (result.error) {
        toast.error('No se pudo eliminar la misión')
      }
    })
  }

  return (
    <>
      {modalOpen && <CreateMissionModal onClose={handleClose} />}

      <section aria-labelledby="custom-missions-title" className="flex flex-col gap-4">
        {/* Section header */}
        <div className="border-b border-border/40 pb-2 flex items-center justify-between gap-3">
          <h2
            id="custom-missions-title"
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Mis misiones
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasReachedLimit && (
              <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                Límite del plan gratuito
              </span>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={hasReachedLimit}
              title={hasReachedLimit ? 'Límite del plan gratuito' : undefined}
              className="flex items-center gap-1.5 h-8 px-3 rounded-pill text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                color: 'var(--color-accent)',
                background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              }}
            >
              <Plus size={13} aria-hidden />
              Nueva misión
            </button>
          </div>
        </div>

        {/* Content */}
        {customMissions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Crea tu primera misión personalizada
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 h-11 px-5 rounded-pill text-sm font-semibold border transition-all"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                color: 'var(--color-accent)',
                background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              }}
            >
              <Plus size={15} aria-hidden />
              Nueva misión
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {customMissions.map((mission, idx) => {
              const isLast = idx === customMissions.length - 1
              const isOdd  = customMissions.length % 2 !== 0
              const wrapperClass = isLast && isOdd ? 'col-span-2 md:col-span-1' : undefined
              return (
                <div key={mission.id} className={wrapperClass}>
                  <CustomMissionCard
                    mission={mission}
                    onDelete={handleDelete}
                    isDeleting={deletingId === mission.id}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
