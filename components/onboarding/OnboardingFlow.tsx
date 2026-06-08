'use client'

import { useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sword, Zap, Shield, User, Dumbbell, BookOpen, Star } from 'lucide-react'
import { completeOnboarding, checkUsernameAvailable } from '@/app/onboarding/actions'
import { PACK_LIST } from '@/lib/constants/packs'
import type { PackId } from '@/types/supabase'

const inputClass =
  'w-full bg-surface-elevated border border-border rounded-component px-4 py-3 text-sm ' +
  'text-text-primary placeholder:text-text-muted text-center ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 ' +
  'transition-[border-color,box-shadow] duration-150'

const dateInputClass =
  'w-full bg-surface-elevated border border-border rounded-component px-4 py-3 text-sm ' +
  'text-text-primary text-left ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 ' +
  'transition-[border-color,box-shadow] duration-150'

const STEPS = [
  {
    icon: Sword,
    title: 'Tu aventura empieza aquí',
    description: 'Convierte tus hábitos en misiones. Sube de nivel en la vida real.',
    buttonLabel: 'Empezar',
  },
  {
    icon: Zap,
    title: 'Completa misiones, gana XP',
    description:
      'Cada día tienes misiones de Físico, Mental y Disciplina. Complétalas para ganar experiencia y subir de nivel.',
    buttonLabel: 'Siguiente',
  },
  {
    icon: Shield,
    title: 'Mantén tu racha',
    description:
      'Conectarte cada día mantiene tu racha activa. Cada 7 días consecutivos ganas un escudo que te protege si fallas un día.',
    buttonLabel: 'Siguiente',
  },
] as const

const PACK_ICONS: Record<PackId, React.ElementType> = {
  guerrero: Dumbbell,
  sabio: BookOpen,
  monje: Shield,
  heroe: Star,
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

function UsernameStep({ onNext }: { onNext: (username: string, dateOfBirth: string) => void }) {
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [dobError, setDobError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  const handleUsernameChange = (val: string) => {
    setUsername(val)
    if (usernameError) setUsernameError('')
  }

  const handleDobChange = (val: string) => {
    setDateOfBirth(val)
    if (dobError) setDobError('')
  }

  const handleSubmit = async () => {
    let valid = true

    const trimmed = (username ?? '').trim()
    if (trimmed.length < 3) {
      setUsernameError('Mínimo 3 caracteres')
      valid = false
    } else if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameError('Solo letras, números y guiones bajos, sin espacios')
      valid = false
    }

    if (!dateOfBirth) {
      setDobError('Introduce tu fecha de nacimiento')
      valid = false
    } else {
      const dob = new Date(dateOfBirth)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (dob >= today) {
        setDobError('La fecha no puede ser hoy ni futura')
        valid = false
      } else {
        const age = today.getFullYear() - dob.getFullYear() -
          (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
        if (age < 13) {
          setDobError('Debes tener al menos 13 años para usar MyLevl')
          valid = false
        } else if (age > 80) {
          setDobError('La fecha de nacimiento no es válida')
          valid = false
        }
      }
    }

    if (!valid) return

    setIsChecking(true)
    try {
      const { available } = await checkUsernameAvailable(trimmed)
      if (!available) {
        setUsernameError('Este nombre de héroe ya está en uso')
        return
      }
    } finally {
      setIsChecking(false)
    }

    onNext(trimmed, dateOfBirth)
  }

  return (
    <div className="flex flex-col items-center text-center gap-8 w-full">
      <div
        className="w-20 h-20 rounded-card bg-surface flex items-center justify-center"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <User size={40} strokeWidth={1.5} className="text-text-primary" />
      </div>
      <div className="flex flex-col gap-5 w-full">
        <h1 className="text-2xl font-semibold text-text-primary">
          Elige tu nombre de héroe
        </h1>
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={username}
            onChange={e => handleUsernameChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="darkwolf, ironmind..."
            maxLength={20}
            autoFocus
            className={inputClass}
          />
          {usernameError && (
            <p className="text-xs text-error text-left">{usernameError}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted text-left">
            ¿Cuándo nació el héroe?
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={e => handleDobChange(e.target.value)}
            min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 80); return d.toISOString().slice(0, 10) })()}
            max={new Date().toISOString().slice(0, 10)}
            className={dateInputClass}
            style={{ colorScheme: 'dark', width: '100%', maxWidth: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none' }}
          />
          {dobError ? (
            <p className="text-xs text-error text-left">{dobError}</p>
          ) : (
            <p className="text-xs text-text-muted text-left">Solo tú verás este dato</p>
          )}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isChecking}
        className="w-full bg-accent text-white font-semibold py-3 rounded-component hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isChecking ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Verificando…
          </span>
        ) : (
          'Siguiente'
        )}
      </button>
    </div>
  )
}

function PackStep({
  username,
  dateOfBirth,
}: {
  username: string
  dateOfBirth: string
}) {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!selected) return
    startTransition(async () => {
      await completeOnboarding(username, dateOfBirth, selected)
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary">Elige tu camino</h1>
        <p className="text-sm text-text-muted">Cada pack es un estilo de vida. Podrás cambiarlo cuando quieras.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PACK_LIST.map(pack => {
          const Icon = PACK_ICONS[pack.id]
          const isSelected = selected === pack.id

          return (
            <button
              key={pack.id}
              onClick={() => setSelected(pack.id)}
              className="flex flex-col gap-3 p-4 rounded-card text-left transition-all duration-150"
              style={{
                background: 'var(--color-surface)',
                border: isSelected
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                outline: 'none',
              }}
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              />
              <div className="flex flex-col gap-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                >
                  {pack.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {pack.subtitle}
                </p>
              </div>
              <ul className="flex flex-col gap-0.5">
                {pack.missions.map(m => (
                  <li key={m} className="text-[11px] text-text-muted flex items-start gap-1.5">
                    <span
                      className="mt-[3px] w-1 h-1 rounded-full flex-shrink-0"
                      style={{ background: 'var(--color-text-muted)' }}
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className="w-full bg-accent text-white font-semibold py-3 rounded-component hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Guardando…
          </span>
        ) : (
          'Comenzar aventura'
        )}
      </button>
    </div>
  )
}

export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [userData, setUserData] = useState<{ username: string; dateOfBirth: string } | null>(null)

  const goNext = () => setStep(s => s + 1)
  const skipToUsername = () => setStep(3)

  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (step >= 3) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50 && step < 3) setStep(s => s + 1)
    else if (dx > 50 && step > 0) setStep(s => s - 1)
  }

  const TOTAL_STEPS = 5

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {step < 3 && (
        <button
          onClick={skipToUsername}
          className="absolute top-6 right-6 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Omitir
        </button>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {step < 3 ? (
                (() => {
                  const { icon: Icon, title, description, buttonLabel } = STEPS[step]
                  return (
                    <div className="flex flex-col items-center text-center gap-8 w-full">
                      <div
                        className="w-20 h-20 rounded-card bg-surface flex items-center justify-center"
                        style={{ border: '1px solid var(--color-border)' }}
                      >
                        <Icon size={40} strokeWidth={1.5} className="text-text-primary" />
                      </div>
                      <div className="flex flex-col gap-3">
                        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
                        <p className="text-text-muted leading-relaxed">{description}</p>
                      </div>
                      <button
                        onClick={goNext}
                        className="w-full bg-accent text-white font-semibold py-3 rounded-component hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  )
                })()
              ) : step === 3 ? (
                <UsernameStep
                  onNext={(username, dateOfBirth) => {
                    setUserData({ username, dateOfBirth })
                    setStep(4)
                  }}
                />
              ) : (
                <PackStep
                  username={userData?.username ?? ''}
                  dateOfBirth={userData?.dateOfBirth ?? ''}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Progreso del onboarding">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={step === i}
              className="w-2 h-2 rounded-full transition-colors duration-200"
              style={{
                backgroundColor:
                  step === i ? 'var(--color-text-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
