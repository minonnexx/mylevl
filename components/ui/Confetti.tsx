'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
  color: string
  w: number
  h: number
}

const DURATION = 3000

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const s = getComputedStyle(document.documentElement)
    const colors = [
      s.getPropertyValue('--color-fisico').trim() || '#1D9E75',
      s.getPropertyValue('--color-mental').trim() || '#7F77DD',
      s.getPropertyValue('--color-disciplina').trim() || '#BA7517',
      s.getPropertyValue('--color-text-primary').trim() || '#F2F2F0',
    ]

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: 8 + Math.random() * 6,
      h: 4 + Math.random() * 4,
    }))

    const start = performance.now()
    let raf: number

    function draw(now: number) {
      const progress = Math.min((now - start) / DURATION, 1)
      const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.globalAlpha = alpha

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.rotation += p.rotSpeed
        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx!.restore()
      }

      if (progress < 1) {
        raf = requestAnimationFrame(draw)
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden
    />
  )
}
