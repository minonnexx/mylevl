let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  } catch {
    return null
  }
}

function prefersReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function initAudio(): void {
  const ctx = getCtx()
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain = 0.25,
  type: OscillatorType = 'sine'
): void {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration)
}

export function playMissionComplete(): void {
  if (prefersReduced()) return
  try {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    tone(ctx, 523.25, t, 0.08)        // C5
    tone(ctx, 659.25, t + 0.09, 0.1)  // E5
  } catch {}
}

export function playLevelUp(): void {
  if (prefersReduced()) return
  try {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5-E5-G5-C6
    notes.forEach((freq, i) => tone(ctx, freq, t + i * 0.11, 0.15, 0.28))
  } catch {}
}

export function playShieldGained(): void {
  if (prefersReduced()) return
  try {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    tone(ctx, 800, t, 0.2, 0.22, 'triangle')
    tone(ctx, 1200, t + 0.05, 0.15, 0.1, 'triangle')
  } catch {}
}
