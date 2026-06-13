'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import {
  Dumbbell,
  Brain,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Smartphone,
  Sparkles,
  Star,
  Heart,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

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

// ── Waitlist form ────────────────────────────────────────────────
function WaitlistForm() {
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
        <p className="text-text-primary font-medium">¡Apuntado!</p>
        <p className="text-sm text-text-muted text-center">
          Te avisaremos cuando lancemos.
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
        className="px-6 py-3 rounded-component text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        style={{
          background: 'var(--color-accent)',
          minHeight: '44px',
        }}
      >
        {loading ? 'Apuntando...' : 'Apuntarme'}
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <GridTexture />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div style={{ height: 32, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="MyLevl"
            style={{ display: 'block', height: 55, width: 55 }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-2"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
        <FadeSection>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="MyLevl"
            className="block rounded-card mb-4 mx-auto h-48 md:h-56 w-auto"
          />
        </FadeSection>

        <FadeSection delay={0.03}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium text-accent mb-8"
            style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)' }}
          >
            <Zap size={12} />
            En desarrollo — lista de espera abierta
          </div>
        </FadeSection>

        <FadeSection delay={0.05}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-text-primary leading-tight">
            Tu próximo logro no está{' '}
            <br className="hidden sm:block" />
            en un videojuego
          </h1>
        </FadeSection>

        <FadeSection delay={0.1}>
          <p className="mt-6 text-base sm:text-lg text-text-muted max-w-xl leading-relaxed">
            Sube de nivel en la vida real completando misiones, construyendo hábitos
            y compitiendo con tus amigos.
          </p>
        </FadeSection>

        <FadeSection delay={0.15}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <a
              href="#waitlist"
              className="px-6 py-3 rounded-component text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: 'var(--color-accent)', minHeight: '44px' }}
            >
              Unirme a la lista de espera
              <ArrowRight size={15} />
            </a>
            <Link
              href="/auth"
              className="px-6 py-3 rounded-component text-sm font-medium text-text-primary transition-colors hover:text-accent flex items-center justify-center"
              style={{
                border: '1px solid var(--color-border)',
                minHeight: '44px',
              }}
            >
              Iniciar sesión
            </Link>
          </div>
        </FadeSection>
      </section>

      {/* ── Divider ── */}
      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 2. El problema ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <FadeSection>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4">
            ¿Cuántos hábitos has dejado a medias?
          </h2>
          <p className="text-text-muted text-center text-sm sm:text-base max-w-lg mx-auto mb-14 leading-relaxed">
            No es falta de voluntad. Es que los hábitos son aburridos sin contexto, sin progreso visible y sin nadie que te acompañe.
          </p>
        </FadeSection>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: <TrendingUp size={20} />,
              title: 'Sin motivación visual',
              desc: 'Las apps de hábitos muestran rachas, no progreso real. No ves cómo mejoras.',
            },
            {
              icon: <Star size={20} />,
              title: 'Sin recompensa',
              desc: 'Completar una tarea debería sentirse bien. Sin XP, sin medallas, nada.',
            },
            {
              icon: <Users size={20} />,
              title: 'Sin comunidad',
              desc: 'Solos es difícil. Sin amigos que te empujen, la motivación dura días.',
            },
          ].map((item, i) => (
            <FadeSection key={item.title} delay={i * 0.07}>
              <div
                className="p-6 rounded-card flex flex-col gap-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-component flex items-center justify-center text-text-muted"
                  style={{ background: 'rgba(127,119,221,0.08)' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm mb-1">{item.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 3. La solución ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <FadeSection>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4">
            MyLevl convierte tus hábitos en misiones
          </h2>
          <p className="text-text-muted text-center text-sm sm:text-base max-w-lg mx-auto mb-14 leading-relaxed">
            Un sistema de progresión RPG diseñado para el mundo real. Tu personaje crece cuando tú creces.
          </p>
        </FadeSection>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Dumbbell size={20} className="text-fisico" />,
              color: 'var(--color-fisico)',
              glow: 'rgba(29,158,117,0.08)',
              title: 'Misiones diarias',
              desc: 'Completa retos físicos, mentales y de disciplina adaptados a tu camino.',
            },
            {
              icon: <Brain size={20} className="text-mental" />,
              color: 'var(--color-mental)',
              glow: 'rgba(127,119,221,0.08)',
              title: 'Sube de nivel',
              desc: 'Gana XP, desbloquea medallas y observa tu progreso de forma tangible.',
            },
            {
              icon: <Users size={20} className="text-disciplina" />,
              color: 'var(--color-disciplina)',
              glow: 'rgba(186,117,23,0.08)',
              title: 'Compite con amigos',
              desc: 'Ligas semanales para motivaros juntos. El progreso de los demás te impulsa.',
            },
          ].map((item, i) => (
            <FadeSection key={item.title} delay={i * 0.07}>
              <div
                className="p-6 rounded-card flex flex-col gap-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-component flex items-center justify-center"
                  style={{ background: item.glow }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm mb-1">{item.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 4. Próximamente ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <FadeSection>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4">
            Esto es solo el principio
          </h2>
          <p className="text-text-muted text-center text-sm sm:text-base max-w-lg mx-auto mb-14 leading-relaxed">
            La versión actual ya funciona. Esto es lo que viene después.
          </p>
        </FadeSection>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            { icon: <Sparkles size={16} />, label: 'Coach de IA personalizado' },
            { icon: <Smartphone size={16} />, label: 'App nativa iOS y Android' },
            { icon: <Shield size={16} />, label: 'Misiones personalizadas avanzadas' },
            { icon: <Star size={16} />, label: 'Planes premium' },
          ].map((item, i) => (
            <FadeSection key={item.label} delay={i * 0.06}>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-component"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <span className="text-text-muted">{item.icon}</span>
                <span className="text-sm text-text-secondary">{item.label}</span>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 5. Apoya el proyecto ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center">
        <FadeSection>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
            Apoya MyLevl
          </h2>
          <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            MyLevl es un proyecto independiente en desarrollo. Tu apoyo hace posible que siga creciendo.
          </p>
          <a
            href="https://www.patreon.com/cw/mylevl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-component text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)', minHeight: '44px' }}
          >
            <Heart size={16} />
            Apoyar en Patreon
          </a>
          <p className="mt-5 text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
            Los mecenas tendrán acceso anticipado y ventajas exclusivas en la versión final.
          </p>
        </FadeSection>
      </section>

      {/* ── Divider ── */}
      <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* ── 6. Lista de espera ── */}
      <section id="waitlist" className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center">
        <FadeSection>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
            Sé el primero en saberlo
          </h2>
          <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Apúntate a la lista de espera y te avisaremos en cuanto lancemos.
          </p>
          <WaitlistForm />
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-6 py-8 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span className="text-xs text-text-muted">MyLevl © 2025</span>
        <div className="flex items-center gap-4">
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
