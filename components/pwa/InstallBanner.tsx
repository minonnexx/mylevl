'use client'

import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'

const DISMISSED_KEY = 'pwa-dismissed'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    return Date.now() - ts < DISMISS_TTL_MS
  } catch {
    return false
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  } catch {}
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIosSafari, setIsIosSafari] = useState(false)
  const [showSafariHint, setShowSafariHint] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isDismissed()) return

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isIos && isSafari && !isStandalone) {
      setIsIosSafari(true)
      setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleDismiss() {
    dismiss()
    setVisible(false)
  }

  async function handleInstall() {
    if (isIosSafari) {
      setShowSafariHint(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss()
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{ zIndex: 40 }}
      className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-white/10 p-4 flex flex-col gap-3"
    >
      {showSafariHint ? (
        <div className="flex items-start gap-3">
          <Share size={18} className="shrink-0 mt-0.5 text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-primary)] flex-1">
            Pulsa <strong>Compartir</strong> en Safari y luego{' '}
            <strong>Añadir a inicio</strong> para instalar MyLevl.
          </p>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--color-text-primary)] flex-1">
            Añade MyLevl a tu pantalla de inicio
          </p>
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-1.5 hover:opacity-90 transition-opacity"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Ahora no"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
