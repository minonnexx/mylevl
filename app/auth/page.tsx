import AuthForm from '@/components/AuthForm'

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="MyLevl"
            style={{ display: 'block', height: 88, width: 88, margin: '0 auto 20px' }}
            className="rounded-card"
          />
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
