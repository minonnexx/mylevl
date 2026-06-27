'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Sword, Swords, Zap, Shield, User, Dumbbell, BookOpen, Star, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { completeOnboarding, checkUsernameAvailable } from '@/app/onboarding/actions'
import { PACK_LIST } from '@/lib/constants/packs'
import AvatarCreator from '@/components/avatar/AvatarCreator'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { useTypewriterSound } from '@/hooks/useTypewriterSound'
import type { AvatarConfig, PackId } from '@/types/supabase'

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

const glowBtn =
  'w-full bg-accent text-white font-semibold py-3 rounded-component ' +
  'border border-accent/40 ' +
  'hover:shadow-[0_0_16px_rgba(127,119,221,0.35)] ' +
  'active:scale-[0.96] transition-all duration-150 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'

const STEPS = [
  {
    icon: Sword,
    title: 'Tu aventura empieza aquí',
    description: 'Convierte tus hábitos en misiones. Sube de nivel en la vida real.',
    buttonLabel: 'Empezar',
  },
  {
    icon: Zap,
    title: 'Cada misión cuenta',
    description:
      'Cada día tienes misiones de Físico, Mental y Disciplina. Complétalas para ganar experiencia y subir de nivel.',
    buttonLabel: 'Siguiente',
  },
  {
    icon: Shield,
    title: 'La constancia es tu arma',
    description:
      'Conectarte cada día mantiene tu racha activa. Cada 7 días consecutivos ganas un escudo que te protege si fallas un día.',
    buttonLabel: 'Siguiente',
  },
] as const

const STEP_COLORS = [
  'var(--color-fisico)',
  'var(--color-mental)',
  'var(--color-disciplina)',
] as const

const STEP_GLOWS = [
  'rgba(29,158,117,0.3)',
  'rgba(127,119,221,0.3)',
  'rgba(186,117,23,0.3)',
] as const

const PACK_CLASS_COLORS: Record<PackId, string> = {
  guerrero: 'var(--color-fisico)',
  sabio: 'var(--color-mental)',
  monje: 'var(--color-disciplina)',
  heroe: 'var(--color-accent)',
}

const PACK_ICONS: Record<PackId, React.ElementType> = {
  guerrero: Dumbbell,
  sabio: BookOpen,
  monje: Shield,
  heroe: Star,
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

const DIALOGUE = [
  'Yo soy tú.',
  'Y tú eres yo.',
  'Vamos a trabajar juntos para sacar la mejor versión de nosotros mismos.',
]

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

// ── Staggered entrance helper ─────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={prefersReduced ? { opacity: 1 } : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: prefersReduced ? 0 : 0.35,
        ease: 'easeOut',
        delay: prefersReduced ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── UsernameStep ──────────────────────────────────────────────────────────────
function UsernameStep({
  initialUsername,
  initialDateOfBirth,
  onNext,
}: {
  initialUsername: string
  initialDateOfBirth: string
  onNext: (username: string, dateOfBirth: string) => void
}) {
  const [username, setUsername] = useState(initialUsername)
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth)
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
      <FadeUp>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-accent)',
            boxShadow: '0 0 20px rgba(127,119,221,0.25)',
          }}
        >
          <User size={36} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
        </div>
      </FadeUp>

      <div className="flex flex-col gap-5 w-full">
        <FadeUp delay={0.08}>
          <h1 className="text-2xl font-semibold text-text-primary">
            Elige tu nombre de héroe
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
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
        </FadeUp>

        <FadeUp delay={0.22}>
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
        </FadeUp>
      </div>

      <FadeUp delay={0.3} className="w-full">
        <button
          onClick={handleSubmit}
          disabled={isChecking}
          className={glowBtn}
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
      </FadeUp>
    </div>
  )
}

// ── CharacterIntroStep ────────────────────────────────────────────────────────
function CharacterIntroStep({
  avatarConfig,
  onNext,
}: {
  avatarConfig: AvatarConfig | null
  onNext: () => void
}) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const { playTick } = useTypewriterSound()
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    let cancelled = false

    async function run() {
      let accumulated = ''
      for (let s = 0; s < DIALOGUE.length; s++) {
        if (s > 0) {
          await sleep(700)
          if (cancelled) return
          accumulated += '\n\n'
          setText(accumulated)
        }
        const segment = DIALOGUE[s]
        for (let c = 0; c < segment.length; c++) {
          if (cancelled) return
          accumulated += segment[c]
          setText(accumulated)
          playTick()
          await sleep(44)
        }
        if (s < DIALOGUE.length - 1) {
          await sleep(900)
        }
      }
      if (!cancelled) setDone(true)
    }

    run()
    return () => { cancelled = true }
  }, [playTick])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        width: '100%',
        maxWidth: '360px',
      }}
    >
      {/* Avatar con float idle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          animate={prefersReduced ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
        >
          <AvatarDisplay config={avatarConfig} size={160} />
        </motion.div>
      </motion.div>

      {/* Burbuja de diálogo con borde accent */}
      <div
        style={{
          width: '100%',
          minHeight: '120px',
          borderLeft: '3px solid var(--color-accent)',
          paddingLeft: '16px',
          paddingTop: '14px',
          paddingBottom: '14px',
          paddingRight: '12px',
          background: 'var(--color-surface)',
          borderRadius: '0 8px 8px 0',
        }}
      >
        <p
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '18px',
            lineHeight: '1.75',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
          {!done && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1.1em',
                backgroundColor: 'var(--color-accent)',
                verticalAlign: 'text-bottom',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </p>
      </div>

      {done && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onNext}
          className={
            'bg-accent text-white font-semibold rounded-component ' +
            'border border-accent/40 ' +
            'hover:shadow-[0_0_16px_rgba(127,119,221,0.35)] ' +
            'active:scale-[0.96] transition-all duration-150'
          }
          style={{ padding: '12px 48px' }}
        >
          Estoy listo
        </motion.button>
      )}
    </div>
  )
}

// ── PackStep ──────────────────────────────────────────────────────────────────
function PackStep({
  username,
  dateOfBirth,
  avatarConfig,
  initialPack,
  onPackChange,
}: {
  username: string
  dateOfBirth: string
  avatarConfig: AvatarConfig | null
  initialPack: PackId | null
  onPackChange: (pack: PackId) => void
}) {
  const [selected, setSelected] = useState<PackId | null>(initialPack)
  const [isPending, startTransition] = useTransition()

  const handleSelect = (pack: PackId) => {
    setSelected(pack)
    onPackChange(pack)
  }

  const handleConfirm = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await completeOnboarding(username, dateOfBirth, selected, avatarConfig)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center flex flex-col gap-2">
        <FadeUp>
          <h1 className="text-2xl font-semibold text-text-primary">Elige tu camino</h1>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p className="text-sm text-text-muted">Cada pack es un estilo de vida. Podrás cambiarlo cuando quieras.</p>
        </FadeUp>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PACK_LIST.map((pack, index) => {
          const Icon = PACK_ICONS[pack.id]
          const isSelected = selected === pack.id
          const classColor = PACK_CLASS_COLORS[pack.id]

          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3, ease: 'easeOut' }}
              onClick={() => handleSelect(pack.id)}
              className="flex flex-col gap-3 p-4 rounded-card text-left"
              style={{
                background: 'var(--color-surface)',
                border: isSelected
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                borderLeft: `3px solid ${classColor}`,
                outline: 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 16px rgba(127,119,221,0.2)' : 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              }}
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                style={{ color: isSelected ? classColor : 'var(--color-text-muted)' }}
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
            </motion.button>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="w-full"
      >
        <button
          onClick={handleConfirm}
          disabled={!selected || isPending}
          className={
            'w-full bg-accent text-white font-semibold py-3 rounded-component ' +
            'border border-accent/40 ' +
            'hover:shadow-[0_0_24px_rgba(127,119,221,0.5)] ' +
            'active:scale-[0.96] transition-all duration-150 ' +
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
          }
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
      </motion.div>

      <div className="flex items-start gap-2 pt-1">
        <Swords size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '1px' }} aria-hidden />
        <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
          ¿Tienes un hábito específico en mente? Puedes crear tus propias misiones en la pestaña Misiones
        </p>
      </div>
    </div>
  )
}

// ── OnboardingFlow ────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [onboardingData, setOnboardingData] = useState({
    username: '',
    dateOfBirth: '',
    avatarConfig: null as AvatarConfig | null,
    activePack: null as PackId | null,
  })

  const goNext = () => { setDirection(1); setStep(s => s + 1) }
  const goBack = () => { setDirection(-1); setStep(s => s - 1) }
  const skipToUsername = () => { setDirection(1); setStep(3) }

  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (step >= 3) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50 && step < 2) { setDirection(1); setStep(s => s + 1) }
    else if (dx > 50 && step > 0) { setDirection(-1); setStep(s => s - 1) }
  }

  const BackButton = () => (
    <button
      onClick={goBack}
      aria-label="Volver"
      style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '44px',
        minHeight: '44px',
        color: 'var(--color-text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <ChevronLeft size={22} />
    </button>
  )

  const slideVariants = {
    initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  }

  // Step 5: pantalla inmersiva — sin dots, sin nav estándar
  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <BackButton />
        <CharacterIntroStep
          avatarConfig={onboardingData.avatarConfig}
          onNext={() => { setDirection(1); setStep(6) }}
        />
      </div>
    )
  }

  const dotStep =
    step <= 2 ? 0 :
    step === 3 ? 1 :
    step === 4 ? 2 :
    step === 6 ? 4 : 0
  const TOTAL_DOTS = 5

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {step > 0 && <BackButton />}

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
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {step < 3 ? (
                (() => {
                  const { icon: Icon, title, description, buttonLabel } = STEPS[step]
                  const color = STEP_COLORS[step]
                  const glow = STEP_GLOWS[step]
                  return (
                    <div className="flex flex-col items-center text-center gap-8 w-full">
                      <FadeUp>
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{
                            background: 'var(--color-surface)',
                            border: `1.5px solid ${color}`,
                            boxShadow: `0 0 24px ${glow}`,
                          }}
                        >
                          <Icon size={40} strokeWidth={1.5} style={{ color }} />
                        </div>
                      </FadeUp>
                      <div className="flex flex-col gap-3">
                        <FadeUp delay={0.08}>
                          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
                        </FadeUp>
                        <FadeUp delay={0.16}>
                          <p className="text-text-muted leading-relaxed">{description}</p>
                        </FadeUp>
                      </div>
                      <FadeUp delay={0.24} className="w-full">
                        <button onClick={goNext} className={glowBtn}>
                          {buttonLabel}
                        </button>
                      </FadeUp>
                    </div>
                  )
                })()
              ) : step === 3 ? (
                <UsernameStep
                  initialUsername={onboardingData.username}
                  initialDateOfBirth={onboardingData.dateOfBirth}
                  onNext={(username, dateOfBirth) => {
                    setOnboardingData(prev => ({ ...prev, username, dateOfBirth }))
                    setDirection(1)
                    setStep(4)
                  }}
                />
              ) : step === 4 ? (
                <div className="flex flex-col gap-6 w-full">
                  <div className="text-center flex flex-col gap-2">
                    <FadeUp>
                      <h1 className="text-2xl font-semibold text-text-primary">
                        Crea tu personaje
                      </h1>
                    </FadeUp>
                    <FadeUp delay={0.08}>
                      <p className="text-sm text-text-muted">
                        Este eres tú en el mundo de MyLevl
                      </p>
                    </FadeUp>
                  </div>
                  <AvatarCreator
                    initialConfig={onboardingData.avatarConfig}
                    onComplete={cfg => {
                      setOnboardingData(prev => ({ ...prev, avatarConfig: cfg }))
                      setDirection(1)
                      setStep(5)
                    }}
                  />
                </div>
              ) : (
                <PackStep
                  username={onboardingData.username}
                  dateOfBirth={onboardingData.dateOfBirth}
                  avatarConfig={onboardingData.avatarConfig}
                  initialPack={onboardingData.activePack}
                  onPackChange={pack =>
                    setOnboardingData(prev => ({ ...prev, activePack: pack }))
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots — píldora activa */}
        <div className="flex gap-2" role="tablist" aria-label="Progreso del onboarding">
          {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={dotStep === i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: dotStep === i ? '24px' : '8px',
                backgroundColor:
                  dotStep === i ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
