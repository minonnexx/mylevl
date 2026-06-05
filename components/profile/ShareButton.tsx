'use client'

import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API not available — silent fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="
        flex items-center gap-2 h-10 px-4 rounded-component
        bg-surface border border-border
        text-text-secondary text-sm font-medium
        hover:text-text-primary hover:border-border/80
        transition-all duration-150 cursor-pointer
        active:scale-[0.98]
      "
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-fisico flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          ¡Copiado!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Compartir perfil
        </>
      )}
    </button>
  )
}
