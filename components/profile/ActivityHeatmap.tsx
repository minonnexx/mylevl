'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type DayData = { date: string; missions_completed: number }
type Props = { data: DayData[] }

const DAYS_LABEL = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTHS_ES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// isoWeekday: Monday=0 … Sunday=6
function isoWeekday(d: Date): number {
  const day = d.getDay() // 0=Sun
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

function cellStyle(level: 0 | 1 | 2 | 3): React.CSSProperties {
  if (level === 0) {
    return {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid rgba(136,135,132,0.2)',
    }
  }
  const pct = level === 1 ? 30 : level === 2 ? 60 : 100
  return {
    backgroundColor: `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`,
    border: '1px solid transparent',
  }
}

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

// Build the week-column grid for a given year/month.
// Returns an array of columns; each column has 7 slots (Mon–Sun), null = outside month.
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  // start on the Monday of the week containing the 1st
  const startOffset = isoWeekday(firstDay)
  const gridStart   = new Date(year, month, 1 - startOffset)

  const weeks: (Date | null)[][] = []
  let cur = new Date(gridStart)

  while (cur <= lastDay) {
    const col: (Date | null)[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(cur)
      day.setDate(cur.getDate() + d)
      col.push(day.getMonth() === month ? day : null)
    }
    weeks.push(col)
    cur.setDate(cur.getDate() + 7)
  }

  return weeks
}

export function ActivityHeatmap({ data }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [offset, setOffset] = useState(0) // 0 = current month, -1 = last month, etc.

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) map.set(d.date, d.missions_completed)
    return map
  }, [data])

  const { year, month, weeks, activeDays } = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const grid = buildMonthGrid(y, m)

    let active = 0
    for (const col of grid) {
      for (const day of col) {
        if (day && (dataMap.get(toKey(day)) ?? 0) > 0) active++
      }
    }

    return { year: y, month: m, weeks: grid, activeDays: active }
  }, [offset, dataMap])

  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const isCurrentMonth = offset === 0
  const canGoBack = offset > -11 // max 12 months back

  return (
    <section aria-labelledby="section-heatmap">
      <div className="border-b border-border/40 pb-2 mb-4">
        <h2 id="section-heatmap" className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Actividad
        </h2>
      </div>

      <div className="bg-surface rounded-card p-6 border border-border/60">

        {/* Navigation header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setOffset(o => o - 1)}
            disabled={!canGoBack}
            aria-label="Mes anterior"
            className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>

          <span className="text-sm font-semibold text-text-primary tabular-nums">
            {MONTHS_ES[month]} {year}
          </span>

          <button
            onClick={() => setOffset(o => o + 1)}
            disabled={isCurrentMonth}
            aria-label="Mes siguiente"
            className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: 0 }}>

          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 8, paddingTop: 0 }}>
            {DAYS_LABEL.map(label => (
              <div
                key={label}
                style={{
                  width: 12,
                  height: 14,
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: colIdx < weeks.length - 1 ? 4 : 0 }}>
              {col.map((day, rowIdx) => {
                if (!day) {
                  return (
                    <div key={rowIdx} style={{ width: 14, height: 14 }} />
                  )
                }

                const key = toKey(day)
                const count = dataMap.get(key) ?? 0
                const level = getLevel(count)
                const isFuture = day > today
                const tooltipText = `${count} ${count === 1 ? 'misión completada' : 'misiones completadas'} · ${formatDateEs(key)}`

                return (
                  <div
                    key={rowIdx}
                    role="img"
                    aria-label={tooltipText}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      cursor: count > 0 ? 'default' : 'default',
                      opacity: isFuture ? 0.25 : 1,
                      ...cellStyle(level),
                    }}
                    onMouseEnter={e => {
                      if (isFuture) return
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text: tooltipText })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer: active days counter + legend */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-text-muted">
            {activeDays} {activeDays === 1 ? 'día activo' : 'días activos'} en {MONTHS_ES[month].toLowerCase()}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Menos</span>
            {([0, 1, 2, 3] as const).map(l => (
              <div
                key={l}
                style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, ...cellStyle(l) }}
              />
            ))}
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Más</span>
          </div>
        </div>
      </div>

      {/* Tooltip — fixed positioning */}
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
