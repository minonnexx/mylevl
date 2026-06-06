'use client'

import { useActionState, useState } from 'react'
import { authenticate, type AuthState } from '@/app/auth/actions'

const initialState: AuthState = { error: '' }

const inputClass =
  'w-full bg-surface-elevated border border-border rounded-component px-4 py-3 text-sm ' +
  'text-text-primary placeholder:text-text-muted ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 ' +
  'transition-[border-color,box-shadow] duration-150'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium text-text-secondary tracking-wide"
    >
      {children}
    </label>
  )
}

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [state, formAction, isPending] = useActionState(authenticate, initialState)
  const isLogin = mode === 'login'

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="mode" value={mode} />

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className={inputClass}
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 text-sm text-error bg-error/8 border border-error/20 rounded-component px-4 py-3"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white font-semibold py-3 rounded-component transition-all duration-150 hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Cargando…
          </span>
        ) : isLogin ? 'Entrar' : 'Crear cuenta'}
      </button>

      <p className="text-center text-sm text-text-muted">
        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={() => setMode(isLogin ? 'signup' : 'login')}
          className="text-accent font-medium hover:underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          {isLogin ? 'Regístrate' : 'Inicia sesión'}
        </button>
      </p>
    </form>
  )
}
