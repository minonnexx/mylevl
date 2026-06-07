'use client'

import { useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sword, Zap, Shield, User } from 'lucide-react'
import { completeOnboarding } from '@/app/onboarding/actions'

const inputClass =
  'w-full bg-surface-elevated border border-border rounded-component px-4 py-3 text-sm ' +
  'text-text-primary placeholder:text-text-muted text-center ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 ' +
  'transition-[border-color,box-shadow] duration-150'

const STEPS = [
  {
    icon: Sword,
    title: 'Bienvenido a mylevl',
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

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

function UsernameStep() {
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [dobError, setDobError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleUsernameChange = (val: string) => {
    setUsername(val)
    if (usernameError) setUsernameError('')
  }

  const handleDobChange = (val: string) => {
    setDateOfBirth(val)
    if (dobError) setDobError('')
  }

  const handleSubmit = () => {
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
        }
      }
    }

    if (!valid) return

    startTransition(async () => {
      const result = await completeOnboarding(trimmed, dateOfBirth)
      if (result?.error) setUsernameError(result.error)
    })
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
          ¿Cómo quieres que te llamen?
        </h1>
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={username}
            onChange={e => handleUsernameChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Tu nombre de jugador"
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
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={e => handleDobChange(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
            style={{ colorScheme: 'dark' }}
          />
          {dobError && (
            <p className="text-xs text-error text-left">{dobError}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isPending}
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

  const goNext = () => setStep(s => s + 1)
  const skipToUsername = () => setStep(3)

  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Disable swipe on username step (step 3) to avoid interfering with input
    if (step === 3) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50 && step < 3) setStep(s => s + 1)
    else if (dx > 50 && step > 0) setStep(s => s - 1)
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button — visible en pasos 0-2 */}
      {step < 3 && (
        <button
          onClick={skipToUsername}
          className="absolute top-6 right-6 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Omitir
        </button>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Contenido animado */}
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
              ) : (
                <UsernameStep />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicador de progreso */}
        <div className="flex gap-2" role="tablist" aria-label="Progreso del onboarding">
          {[0, 1, 2, 3].map(i => (
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
