import AuthForm from '@/components/AuthForm'

function LogoMark() {
  return (
    <div className="mx-auto mb-5 w-14 h-14 rounded-card bg-accent/10 border border-accent/25 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-7 h-7 text-accent"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    </div>
  )
}

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(rgba(127,119,221,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(127,119,221,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <LogoMark />
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Logros Reales
          </h1>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            Sube de nivel en la vida real
          </p>
        </div>

        <div
          className="bg-surface rounded-card p-8"
          style={{
            border: '1px solid rgba(127,119,221,0.1)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 24px 48px rgba(0,0,0,0.5)',
          }}
        >
          <AuthForm />
        </div>
      </div>
    </main>
  )
}
