'use client'

import { useRef, useCallback } from 'react'

const LS_KEY = 'typewriter-sound-enabled'

function isSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(LS_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useTypewriterSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const lastTickRef = useRef<number>(0)

  const playTick = useCallback(() => {
    if (prefersReducedMotion()) return
    if (!isSoundEnabled()) return

    const now = Date.now()
    if (now - lastTickRef.current < 50) return
    lastTickRef.current = now

    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContext()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const freq = 400 + Math.random() * 400
      const t = ctx.currentTime

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.1, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(t)
      osc.stop(t + 0.045)
    } catch {
      // AudioContext puede fallar en entornos restringidos
    }
  }, [])

  return { playTick }
}

export function setTypewriterSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LS_KEY, String(enabled))
  } catch {}
}

export function getTypewriterSoundEnabled(): boolean {
  return isSoundEnabled()
}
