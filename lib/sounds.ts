function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let isPlaying = false
const queue: Array<() => void> = []

function playNext(): void {
  if (queue.length === 0) {
    isPlaying = false
    return
  }
  const next = queue.shift()!
  next()
}

function enqueue(fn: () => void): void {
  if (!isPlaying) {
    isPlaying = true
    fn()
  } else {
    queue.push(fn)
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain = 0.25,
  type: OscillatorType = 'sine'
): OscillatorNode {
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
  return osc
}

export function playMissionComplete(): void {
  if (prefersReduced()) return
  enqueue(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      tone(ctx, 523.25, t, 0.08)
      const last = tone(ctx, 659.25, t + 0.09, 0.1)
      last.onended = () => {
        ctx.close()
        playNext()
      }
    } catch {
      playNext()
    }
  })
}

export function playLevelUp(): void {
  if (prefersReduced()) return
  enqueue(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.slice(0, -1).forEach((freq, i) => tone(ctx, freq, t + i * 0.11, 0.15, 0.28))
      const last = tone(ctx, notes[3], t + 3 * 0.11, 0.15, 0.28)
      last.onended = () => {
        ctx.close()
        playNext()
      }
    } catch {
      playNext()
    }
  })
}

export function playShieldGained(): void {
  if (prefersReduced()) return
  enqueue(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      const last = tone(ctx, 800, t, 0.2, 0.22, 'triangle')
      tone(ctx, 1200, t + 0.05, 0.15, 0.1, 'triangle')
      last.onended = () => {
        ctx.close()
        playNext()
      }
    } catch {
      playNext()
    }
  })
}

export function playDayComplete(): void {
  if (prefersReduced()) return
  enqueue(() => {
    try {
      const ctx = new AudioContext()
      const t = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1318.51] // C5-E5-G5-E6
      notes.slice(0, -1).forEach((freq, i) => tone(ctx, freq, t + i * 0.15, 0.3, 0.28))
      const last = tone(ctx, notes[3], t + 3 * 0.15, 0.3, 0.3)
      last.onended = () => {
        ctx.close()
        playNext()
      }
    } catch {
      playNext()
    }
  })
}
