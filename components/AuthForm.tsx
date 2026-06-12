'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authenticate, type AuthState } from '@/app/auth/actions'

const initialState: AuthState = { error: '' }

const inputClass =
  'w-full bg-surface-elevated border border-border rounded-component px-4 py-3 text-sm ' +
  'text-text-primary placeholder:text-text-muted ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 ' +
  'transition-[border-color,box-shadow] duration-150'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-text-secondary tracking-wide">
      {children}
    </label>
  )
}

function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder = '••••••••',
}: {
  id: string
  name: string
  autoComplete: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        className={inputClass + ' pr-12'}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        style={{ minHeight: '44px' }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
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
        <FieldLabel htmlFor="email">
          {isLogin ? 'Email o nombre de héroe' : 'Email'}
        </FieldLabel>
        <input
          id="email"
          name="email"
          type={isLogin ? 'text' : 'email'}
          placeholder={isLogin ? 'tu@email.com o nombre_héroe' : 'tu@email.com'}
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="invite_code">Código de acceso</FieldLabel>
          <input
            id="invite_code"
            name="invite_code"
            type="text"
            placeholder="Tu código de invitación"
            required
            autoComplete="off"
            className={inputClass}
          />
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 text-sm text-error bg-error/8 border border-error/20 rounded-component px-4 py-3"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden />
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
