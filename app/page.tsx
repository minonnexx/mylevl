'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import {
  Dumbbell,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
  Star,
  Heart,
  ArrowRight,
  Swords,
  Target,
  Calendar,
  MessageCircle,
  Rocket,
  Compass,
  CheckCircle2,
  Check,
  Mail,
  Menu,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { HexMedal } from '@/components/ui/HexMedal'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { XpBar } from '@/components/dashboard/XpBar'
import { CLASS_META } from '@/lib/constants/classes'
import type { AvatarConfig } from '@/types/supabase'

const DISCORD_URL = 'https://discord.gg/atbMCn7HVA'

const MOCK_AVATAR_CONFIG: AvatarConfig = {
  style: 'adventurer',
  gender: 'male',
  skin: 'medium',
  hair: 'short02',
  hairColor: 'brown',
  eyes: 'variant02',
  mouth: 'variant03',
}

const MOCK_MISSIONS = [
  { lifeClass: 'fisico' as const, title: 'Entrena 30 minutos', xp: 15, completed: true },
  { lifeClass: 'mental' as const, title: 'Lee 20 páginas', xp: 15, completed: false },
  { lifeClass: 'disciplina' as const, title: 'Meditar 10 minutos', xp: 10, completed: false },
]

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#que-hay-dentro', label: 'Qué hay dentro' },
  { href: '#comunidad', label: 'Comunidad' },
]

// ── Animation helpers ────────────────────────────────────────────
const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

function FadeSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      variants={FADE_UP}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Subtle grid texture (same as auth page) ─────────────────────
function GridTexture() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(127,119,221,0.035) 1px, transparent 1px), linear-gradient(to right, rgba(127,119,221,0.035) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
      aria-hidden
    />
  )
}

// ── Section header helper ───────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <FadeSection>
      <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4">{title}</h2>
      <p className="text-text-muted text-center text-sm sm:text-base max-w-lg mx-auto mb-14 leading-relaxed">
        {subtitle}
      </p>
    </FadeSection>
  )
}

// ── Newsletter form (Brevo, lista ID 2) ─────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Introduce un email válido')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error desconocido')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-4"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)' }}
        >
          <Star size={20} className="text-success" />
        </div>
        <p className="text-text-primary font-medium">Suscrito</p>
        <p className="text-sm text-text-muted text-center">
          Te avisaremos con el changelog y las novedades.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="flex-1 px-4 py-3 rounded-component text-text-primary text-sm placeholder:text-text-muted focus:outline-none"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          minHeight: '44px',
        }}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-component text-sm font-medium text-text-primary flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          minHeight: '44px',
        }}
      >
        {loading ? 'Enviando...' : 'Suscribirme'}
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  )
}

// ── Discord CTA (primary funnel) ─────────────────────────────────
function DiscordCta({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={DISCORD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-component font-semibold text-white transition-all hover:opacity-90 ${
        compact ? 'px-5 py-2.5 text-sm' : 'px-7 py-3.5 text-base'
      }`}
      style={{
        background: 'var(--color-accent)',
        minHeight: '44px',
        boxShadow: '0 0 20px rgba(127,119,221,0.35)',
      }}
    >
      <MessageCircle size={compact ? 15 : 18} />
      Únete al Discord
      <ArrowRight size={compact ? 14 : 16} />
    </a>
  )
}

// ── Post-Discord funnel stepper ──────────────────────────────────
function FunnelStepper() {
  const steps = [
    { label: 'Entra al Discord', href: DISCORD_URL, external: true },
    { label: 'Coge tu código', href: DISCORD_URL, external: true },
    { label: 'Vuelve aquí y regístrate', href: '/auth', external: false },
  ]

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-lg mx-auto lg:mx-0">
      {steps.map((step, i) => {
        const content = (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-component flex-1 w-full transition-colors hover:border-accent/40"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
            >
              {i + 1}
            </span>
            <span className="text-xs text-text-secondary text-left">{step.label}</span>
          </div>
        )

        return (
          <div key={step.label} className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
            {step.external ? (
              <a href={step.href} target="_blank" rel="noopener noreferrer" className="w-full">
                {content}
              </a>
            ) : (
              <Link href={step.href} className="w-full">
                {content}
              </Link>
            )}
            {i < steps.length - 1 && (
              <ArrowRight size={14} className="hidden sm:block text-text-muted flex-shrink-0" aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step / mechanic card ─────────────────────────────────────────
function BorderCard({
  color,
  icon,
  title,
  desc,
  index,
}: {
  color: string
  icon: React.ReactNode
  title: string
  desc: string
  index?: string
}) {
  return (
    <div
      className="p-6 rounded-card flex flex-col gap-4 relative"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-component flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
        >
          {icon}
        </div>
        {index && (
          <span className="text-3xl font-black tabular-nums" style={{ color: 'var(--color-border)' }}>
            {index}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-text-primary text-sm mb-1">{title}</p>
        <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Medal showcase (HexMedal, protagonist size) ──────────────────
function MedalShowcase() {
  return (
    <div className="flex items-end justify-center gap-5 mb-14" aria-hidden>
      <div style={{ opacity: 0.55 }}>
        <HexMedal icon="Shield" rarity="rare" size={52} />
      </div>
      <HexMedal icon="Trophy" rarity="legendary" size={96} />
      <div style={{ opacity: 0.55 }}>
        <HexMedal icon="Flame" rarity="epic" size={52} />
      </div>
    </div>
  )
}

// ── Dashboard mockup (real components, example data — not a live account) ──
function DashboardMockup() {
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0">
      <p className="text-xs text-text-muted mb-2 text-center lg:text-left">Así se ve por dentro</p>
      <div
        className="rounded-card p-5 flex flex-col gap-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <AvatarDisplay config={MOCK_AVATAR_CONFIG} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary text-sm leading-snug">Kaelen</p>
            <p className="text-xs text-text-muted">Aventurero</p>
          </div>
          <span
            className="text-[10px] font-black tabular-nums rounded px-1.5 py-0.5 leading-none flex-shrink-0"
            style={{
              color: 'var(--color-accent)',
              background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
            }}
          >
            LVL 7
          </span>
        </div>

        <XpBar current={320} total={520} />

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-component"
          style={{
            background: 'color-mix(in srgb, var(--color-disciplina) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-disciplina) 22%, transparent)',
          }}
        >
          <Zap size={14} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
          <span className="text-xs font-black tabular-nums" style={{ color: 'var(--color-disciplina)' }}>12</span>
          <span className="text-[11px] text-text-muted">días de racha</span>
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
          {MOCK_MISSIONS.map((mission) => {
            const meta = CLASS_META[mission.lifeClass]
            return (
              <div
                key={mission.title}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-component ${mission.completed ? 'opacity-40' : ''}`}
                style={{ background: 'var(--color-surface-elevated)', borderLeft: `3px solid ${meta.color}` }}
              >
                {mission.completed ? (
                  <Check size={14} style={{ color: 'var(--color-success)' }} aria-hidden />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0" style={{ borderColor: meta.color }} aria-hidden />
                )}
                <span className="text-xs text-text-primary flex-1 truncate">{mission.title}</span>
                <span className="text-xs font-black tabular-nums" style={{ color: meta.color }}>+{mission.xp}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Nav with anchors (desktop inline, mobile dropdown) ───────────
function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <nav ref={menuRef} className="relative z-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between px-6 py-5">
        <div style={{ height: 32, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="MyLevl"
            style={{ display: 'block', height: 55, width: 55 }}
          />
        </div>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/auth"
            className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-2"
          >
            Iniciar sesión
          </Link>
          <DiscordCta compact />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-component text-text-primary"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden absolute right-6 left-6 top-full mt-2 rounded-card p-4 flex flex-col gap-1"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-3 rounded-component text-sm text-text-primary hover:bg-surface-elevated transition-colors"
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border/60 my-2" />
          <Link
            href="/auth"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-3 rounded-component text-sm text-text-muted hover:text-text-primary transition-colors"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
          >
            Iniciar sesión
          </Link>
          <div className="px-3 pt-2">
            <DiscordCta compact />
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <GridTexture />

      <LandingNav />

      {/* ── 1. Hero ── */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center gap-12 px-6 pt-16 pb-28 max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1 min-w-0">
          <FadeSection delay={0.03}>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium text-accent"
                style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)' }}
              >
                <Swords size={12} />
                En desarrollo activo, construido junto a la comunidad
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium text-accent"
                style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)' }}
              >
                Beta cerrada — entra antes de que esto se llene
              </div>
            </div>
          </FadeSection>

          <FadeSection delay={0.05}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-text-primary leading-tight">
              Deja de intentar crear hábitos.
              <br />
              Empieza a subir de nivel.
            </h1>
          </FadeSection>

          <FadeSection delay={0.1}>
            <p className="mt-6 text-base sm:text-lg text-text-muted max-w-xl leading-relaxed">
              Tu cerebro pide recompensa ahora, no en tres semanas — por eso abandonas
              los hábitos antes de que funcionen. MyLevl le da a cada misión su XP al
              instante: creas tu personaje, subes de nivel, y la constancia se convierte
              en progreso que se ve y se siente hoy mismo.
            </p>
          </FadeSection>

          <FadeSection delay={0.15} className="w-full">
            <div className="mt-10 flex flex-col items-center lg:items-start gap-3">
              <DiscordCta />
              <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                El código de acceso está ahí dentro — es la forma de entrar en la beta ahora mismo.
              </p>
            </div>
          </FadeSection>

          <FadeSection delay={0.2} className="w-full">
            <FunnelStepper />
          </FadeSection>

          <FadeSection delay={0.25}>
            <a
              href="#actualizaciones"
              className="mt-6 inline-block text-xs text-text-muted hover:text-text-primary transition-colors underline underline-offset-4"
            >
              ¿Sin Discord? Recibe las actualizaciones por email
            </a>
          </FadeSection>
        </div>

        <FadeSection delay={0.12} className="flex-1 w-full max-w-sm lg:max-w-md">
          <DashboardMockup />
        </FadeSection>
      </section>

      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 2. Cómo funciona ── */}
      <section id="como-funciona" className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <SectionHeader
          title="Cómo funciona"
          subtitle="Crea tu personaje, completa misiones reales, sube de nivel. Así de directo."
        />

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              color: 'var(--color-fisico)',
              icon: <Swords size={20} />,
              title: 'Crea tu personaje',
              desc: 'Diseña tu avatar RPG y elige tu pack de misiones: guerrero, sabio, monje o héroe.',
            },
            {
              color: 'var(--color-mental)',
              icon: <Zap size={20} />,
              title: 'Completa misiones',
              desc: 'Entrenar, leer, meditar, dormir bien. Cada hábito real da XP al instante.',
            },
            {
              color: 'var(--color-disciplina)',
              icon: <TrendingUp size={20} />,
              title: 'Sube de nivel',
              desc: 'Tú y tu personaje crecéis juntos. El progreso se ve, se mide y se siente.',
            },
          ].map((item, i) => (
            <FadeSection key={item.title} delay={i * 0.07}>
              <BorderCard {...item} index={`0${i + 1}`} />
            </FadeSection>
          ))}
        </div>
      </section>

      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 3. Qué hay dentro ── */}
      <section id="que-hay-dentro" className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <SectionHeader
          title="Qué hay dentro"
          subtitle="Misiones, XP, rachas y ligas — la progresión completa de tu personaje."
        />

        <MedalShowcase />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              color: 'var(--color-fisico)',
              icon: <Dumbbell size={18} />,
              title: 'Misiones diarias por clase',
              desc: 'Físico, mental y disciplina, adaptadas a tu pack de misiones.',
            },
            {
              color: 'var(--color-accent)',
              icon: <Zap size={18} />,
              title: 'XP y niveles',
              desc: 'Cada misión suma experiencia al instante. Tu personaje sube de nivel contigo.',
            },
            {
              color: 'var(--color-disciplina)',
              icon: <Shield size={18} />,
              title: 'Rachas con escudos',
              desc: 'Cada 7 días de constancia ganas un escudo que protege tu racha si fallas un día.',
            },
            {
              color: 'var(--color-mental)',
              icon: <Users size={18} />,
              title: 'Ligas semanales',
              desc: 'Compite con tus amigos cada semana. Su progreso te empuja a seguir.',
            },
            {
              color: 'var(--color-accent)',
              icon: null,
              title: 'Medallas con rareza',
              desc: 'De común a legendaria, con el porcentaje real de jugadores que las tienen.',
            },
            {
              color: 'var(--color-fisico)',
              icon: <Target size={18} />,
              title: 'Misiones personalizadas',
              desc: 'Crea tus propios retos, con duración, modo estricto y recompensa a medida.',
            },
            {
              color: 'var(--color-disciplina)',
              icon: <Calendar size={18} />,
              title: 'Recap diario',
              desc: 'Tu personaje resume el día, la semana y el mes contigo.',
            },
          ].map((item, i) => (
            <FadeSection key={item.title} delay={(i % 3) * 0.07}>
              <div
                className="p-4 rounded-card flex items-start gap-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-9 h-9 rounded-component flex items-center justify-center flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)`, color: item.color }}
                >
                  {item.icon ?? <HexMedal icon="Trophy" rarity="epic" size={20} />}
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm mb-1">{item.title}</p>
                  <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 4. Roadmap ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <SectionHeader
          title="El camino por delante"
          subtitle="Sin fechas prometidas. Esto es hacia dónde vamos."
        />

        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {[
            {
              color: 'var(--color-fisico)',
              icon: <CheckCircle2 size={18} />,
              title: 'Ahora',
              items: ['Base sólida y estable', 'Primeros beta testers en Discord', 'Pulido constante con feedback real'],
            },
            {
              color: 'var(--color-mental)',
              icon: <Rocket size={18} />,
              title: 'Próximo',
              items: ['Ajustes según el uso real', 'Más contenido de misiones y packs', 'Mejoras que pide la comunidad'],
            },
            {
              color: 'var(--color-disciplina)',
              icon: <Compass size={18} />,
              title: 'Visión',
              items: ['Mentor con IA que te conoce', 'Tu personaje con historia propia', 'Progresión sin final'],
            },
          ].map((block, i) => (
            <FadeSection key={block.title} delay={i * 0.07}>
              <div
                className="p-6 rounded-card h-full flex flex-col gap-4"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${block.color}`,
                }}
              >
                <div className="flex items-center gap-2" style={{ color: block.color }}>
                  {block.icon}
                  <p className="font-semibold text-sm text-text-primary">{block.title}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {block.items.map((line) => (
                    <li key={line} className="text-xs text-text-muted leading-relaxed flex items-start gap-2">
                      <span
                        className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: block.color }}
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeSection>
          ))}
        </div>

        <FadeSection delay={0.2}>
          <p className="text-center text-xs text-text-muted">
            El roadmap completo, con detalle, está fijado en el Discord.
          </p>
        </FadeSection>
      </section>

      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 5. La comunidad ── */}
      <section id="comunidad" className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <SectionHeader
          title="Esto se construye en comunidad"
          subtitle="MyLevl lo hace un desarrollador en solitario. El Discord es donde pasa todo."
        />

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            {
              icon: <MessageCircle size={16} />,
              title: 'Canal de beta testers',
              desc: 'El código de acceso está ahí dentro. Sin esperas ni lista.',
            },
            {
              icon: <Heart size={16} />,
              title: 'Feedback directo con el fundador',
              desc: 'Sin equipos de soporte ni bots — hablas conmigo.',
            },
            {
              icon: <Sparkles size={16} />,
              title: 'Influencia real',
              desc: 'Tus ideas pueden acabar en la próxima actualización.',
            },
            {
              icon: <Rocket size={16} />,
              title: 'Novedades antes que nadie',
              desc: 'Te enteras de cada cambio antes de que salga a la web.',
            },
          ].map((item, i) => (
            <FadeSection key={item.title} delay={i * 0.06}>
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-component h-full"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <span className="text-accent flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>

        <FadeSection delay={0.08}>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
              }}
              aria-hidden
            >
              M
            </div>
            <p className="text-sm text-text-muted">
              <span className="text-text-primary font-medium">Minonne</span> — construyo MyLevl yo solo, y leo cada mensaje del Discord.
            </p>
          </div>
        </FadeSection>

        <FadeSection delay={0.1}>
          <blockquote
            className="px-5 py-4 rounded-component mb-10 text-sm text-text-secondary italic"
            style={{ borderLeft: '3px solid var(--color-accent)', background: 'var(--color-surface)' }}
          >
            No solo uses MyLevl. Ayúdame a construirlo.
          </blockquote>
        </FadeSection>

        <FadeSection delay={0.15}>
          <div className="flex flex-col items-center gap-4">
            <DiscordCta />
            <p className="text-xs text-text-muted max-w-sm text-center leading-relaxed">
              Ahora mismo somos pocos — así es como empiezan las comunidades que de verdad importan.
            </p>
          </div>
        </FadeSection>
      </section>

      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 6. Actualizaciones (newsletter, secundario) ── */}
      <section id="actualizaciones" className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center">
        <FadeSection>
          <div
            className="w-10 h-10 rounded-component flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}
          >
            <Mail size={18} />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">¿Sin Discord?</h2>
          <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Recibe el changelog y las novedades por email.
          </p>
          <NewsletterForm />
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-6 py-8 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span className="text-xs text-text-muted">MyLevl © 2026</span>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Discord
          </a>
          <a
            href="https://www.patreon.com/cw/mylevl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            ¿Quieres apoyar el proyecto? Patreon
          </a>
          <Link href="/auth?mode=login" className="text-xs text-text-muted hover:text-text-primary transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/auth?mode=signup" className="text-xs text-text-muted hover:text-text-primary transition-colors">
            Registrarse
          </Link>
        </div>
      </footer>
    </div>
  )
}
