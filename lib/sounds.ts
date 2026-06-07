function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let isPlaying = false
const soundQueue: Array<{ fn: () => void; duration: number }> = []

function playNext(): void {
  if (isPlaying || soundQueue.length === 0) return
  isPlaying = true
  const { fn, duration } = soundQueue.shift()!
  fn()
  setTimeout(() => {
    isPlaying = false
    playNext()
  }, duration + 100)
}

function queueSound(fn: () => void, duration: number): void {
  soundQueue.push({ fn, duration })
  playNext()
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
  osc.stop(start + duration + 0.05)
}

export function playMissionComplete(): void {
  if (prefersReduced()) return
  queueSound(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      tone(ctx, 523.25, t, 0.08)
      tone(ctx, 659.25, t + 0.09, 0.1)
      setTimeout(() => ctx.close(), 300)
    } catch {}
  }, 200)
}

export function playLevelUp(): void {
  if (prefersReduced()) return
  queueSound(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => tone(ctx, freq, t + i * 0.11, 0.15, 0.28))
      setTimeout(() => ctx.close(), 700)
    } catch {}
  }, 600)
}

export function playShieldGained(): void {
  if (prefersReduced()) return
  queueSound(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      tone(ctx, 800, t, 0.2, 0.22, 'triangle')
      tone(ctx, 1200, t + 0.05, 0.15, 0.1, 'triangle')
      setTimeout(() => ctx.close(), 400)
    } catch {}
  }, 300)
}

export function playDayComplete(): void {
  if (prefersReduced()) return
  queueSound(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1318.51] // C5-E5-G5-E6
      notes.forEach((freq, i) => tone(ctx, freq, t + i * 0.15, 0.3, 0.28))
      setTimeout(() => ctx.close(), 900)
    } catch {}
  }, 800)
}
