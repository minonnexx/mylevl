'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const PALETTE = ['#7F77DD', '#1D9E75', '#BA7517', '#F2F2F0']

export function Confetti() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: PALETTE })

    const t1 = setTimeout(() => {
      confetti({ particleCount: 45, angle: 55, spread: 50, origin: { x: 0, y: 0.65 }, colors: PALETTE })
    }, 200)

    const t2 = setTimeout(() => {
      confetti({ particleCount: 45, angle: 125, spread: 50, origin: { x: 1, y: 0.65 }, colors: PALETTE })
    }, 350)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return null
}
