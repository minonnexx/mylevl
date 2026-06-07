'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { TrendingUp, History } from 'lucide-react'

type DayData = { date: string; missions_completed: number }
type Props = { data: DayData[]; createdAt: string }

// Monday=0 … Sunday=6
function isoWeekday(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 6 : day - 1
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

const CELL = 12
const GAP  = 3
const CELL_STRIDE = CELL + GAP
const DAY_LABEL_W = 14
const DAY_LABEL_GAP = 6
const MONTH_ROW_H  = 16

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTHS_ES_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function cellBg(level: 0 | 1 | 2 | 3): React.CSSProperties {
  if (level === 0) return {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
  }
  const pct = level === 1 ? 30 : level === 2 ? 60 : 100
  return {
    backgroundColor: `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`,
    border: '1px solid transparent',
  }
}

export function ActivityHeatmap({ data, createdAt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  // Measure container width via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0
      setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) map.set(d.date, d.missions_completed)
    return map
  }, [data])

  // How many weeks fit in the available width
  const numWeeks = useMemo(() => {
    if (containerWidth === 0) return 0
    const available = containerWidth - DAY_LABEL_W - DAY_LABEL_GAP
    // at least 1 cell: CELL wide, then each extra needs CELL_STRIDE
    return Math.max(1, Math.floor((available + GAP) / CELL_STRIDE))
  }, [containerWidth])

  const { weeks, monthLabels, activeDays, isNewUser } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const regDate = new Date(createdAt.slice(0, 10) + 'T00:00:00')

    // Rightmost column = week containing today; go back numWeeks-1 more
    const todayWeekday = isoWeekday(today)
    const windowEnd = new Date(today) // stays as today (last valid day)

    // Start of the leftmost column = Monday numWeeks-1 weeks before the current Monday
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() - todayWeekday)
    const gridStart = new Date(currentMonday)
    gridStart.setDate(currentMonday.getDate() - (numWeeks - 1) * 7)

    const weeksArr: (Date | null)[][] = []
    const cur = new Date(gridStart)

    while (cur <= windowEnd) {
      const col: (Date | null)[] = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur)
        day.setDate(cur.getDate() + d)
        // Show day if it's not in the future; cells before registration show as empty (level 0)
        col.push(day <= today ? day : null)
      }
      weeksArr.push(col)
      cur.setDate(cur.getDate() + 7)
    }

    // Month labels at first column where each month starts
    const seen = new Set<string>()
    const labels: { col: number; label: string }[] = []
    weeksArr.forEach((col, colIdx) => {
      const firstReal = col.find(d => d !== null)
      if (!firstReal) return
      const key = `${firstReal.getFullYear()}-${firstReal.getMonth()}`
      if (!seen.has(key)) {
        seen.add(key)
        labels.push({ col: colIdx, label: MONTHS_ES_SHORT[firstReal.getMonth()] })
      }
    })

    // Count active days (only from registration onwards)
    let active = 0
    for (const col of weeksArr) {
      for (const day of col) {
        if (day && day >= regDate && (dataMap.get(toKey(day)) ?? 0) > 0) active++
      }
    }

    const daysRegistered = (today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24)
    const newUser = daysRegistered < 28

    return { weeks: weeksArr, monthLabels: labels, activeDays: active, isNewUser: newUser }
  }, [numWeeks, createdAt, dataMap])

  const regDate = useMemo(() => new Date(createdAt.slice(0, 10) + 'T00:00:00'), [createdAt])

  if (numWeeks === 0) {
    // Render invisible container to measure width before painting
    return (
      <section aria-labelledby="section-heatmap">
        <div className="border-b border-border/40 pb-2 mb-4">
          <h2 id="section-heatmap" className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Actividad
          </h2>
        </div>
        <div className="bg-surface rounded-card p-6 border border-border/60">
          <div ref={containerRef} style={{ width: '100%', height: 1 }} />
        </div>
      </section>
    )
  }

  const gridW = numWeeks * CELL + Math.max(0, numWeeks - 1) * GAP

  return (
    <section aria-labelledby="section-heatmap">
      <div className="border-b border-border/40 pb-2 mb-4">
        <h2
          id="section-heatmap"
          className="text-[11px] font-medium text-text-muted uppercase tracking-wider"
        >
          Actividad
        </h2>
      </div>

      <div className="bg-surface rounded-card p-6 border border-border/60">
        {/* Measurement anchor — tracks the inner width of the card */}
        <div ref={containerRef} style={{ width: '100%', height: 0, overflow: 'hidden' }} />

        {/* Month labels */}
        <div style={{ marginLeft: DAY_LABEL_W + DAY_LABEL_GAP, height: MONTH_ROW_H, position: 'relative', width: gridW }}>
          {monthLabels.map(({ col, label }) => (
            <span
              key={label + col}
              style={{
                position: 'absolute',
                left: col * CELL_STRIDE,
                fontSize: 10,
                lineHeight: `${MONTH_ROW_H}px`,
                color: 'var(--color-text-muted)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid: day labels + week columns */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: DAY_LABEL_GAP }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}>
            {DAY_LABELS.map(label => (
              <div
                key={label}
                style={{
                  width: DAY_LABEL_W,
                  height: CELL,
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: GAP }}>
            {weeks.map((col, colIdx) => (
              <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {col.map((day, rowIdx) => {
                  if (!day) {
                    return <div key={rowIdx} style={{ width: CELL, height: CELL, flexShrink: 0 }} />
                  }

                  const key = toKey(day)
                  const beforeReg = day < regDate
                  const count = beforeReg ? 0 : (dataMap.get(key) ?? 0)
                  const level = getLevel(count)
                  const tooltipText = beforeReg
                    ? `Sin datos · ${day.getDate()} ${MONTHS_ES_SHORT[day.getMonth()]} ${day.getFullYear()}`
                    : `${count} ${count === 1 ? 'misión completada' : 'misiones completadas'} · ${day.getDate()} ${MONTHS_ES_SHORT[day.getMonth()]} ${day.getFullYear()}`

                  return (
                    <div
                      key={rowIdx}
                      role="img"
                      aria-label={tooltipText}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        flexShrink: 0,
                        cursor: 'default',
                        ...cellBg(level),
                      }}
                      onMouseEnter={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text: tooltipText })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer row 1: contador */}
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            {activeDays} {activeDays === 1 ? 'día activo' : 'días activos'} desde que empezaste
          </span>
        </div>

        {/* Footer row 2: leyenda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Menos</span>
          {([0, 1, 2, 3] as const).map(l => (
            <div key={l} style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, ...cellBg(l) }} />
          ))}
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Más</span>
        </div>

        {/* Footer row 3: mensaje motivacional para usuarios nuevos */}
        {isNewUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <TrendingUp size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden />
            <span style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: '30ch' }}>
              Sigue completando misiones para ver tu historial crecer
            </span>
          </div>
        )}

        {/* Footer row 3: botón historial completo (deshabilitado por ahora) */}
        <button
          disabled
          style={{
            marginTop: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-component)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: 14,
            cursor: 'not-allowed',
            opacity: 0.4,
          }}
        >
          <History size={15} aria-hidden />
          Ver historial completo
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </section>
  )
}
