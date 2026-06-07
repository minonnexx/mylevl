'use client'

import { useMemo, useState } from 'react'

type DayData = { date: string; missions_completed: number }
type Props = { data: DayData[] }

const DAYS_LABEL = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function getLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

function cellStyle(level: 0 | 1 | 2 | 3): React.CSSProperties {
  if (level === 0) return { backgroundColor: 'var(--color-surface)' }
  const opacity = level === 1 ? 0.3 : level === 2 ? 0.6 : 1
  return { backgroundColor: `color-mix(in srgb, var(--color-accent) ${opacity * 100}%, transparent)` }
}

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

export function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from Monday 52 weeks ago
    const start = new Date(today)
    start.setDate(today.getDate() - 364)
    // rewind to previous Monday
    const dayOfWeek = start.getDay() // 0=Sun
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    start.setDate(start.getDate() - daysToMonday)

    const map = new Map<string, number>()
    for (const d of data) {
      map.set(d.date, d.missions_completed)
    }

    // Build weeks: array of 7-element columns (Mon=0 … Sun=6)
    const weeksArr: (Date | null)[][] = []
    let cur = new Date(start)

    while (cur <= today) {
      const week: (Date | null)[] = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur)
        day.setDate(cur.getDate() + d)
        week.push(day <= today ? day : null)
      }
      weeksArr.push(week)
      cur.setDate(cur.getDate() + 7)
    }

    // Month labels: detect first week where month changes
    const seen = new Set<number>()
    const monthLabelsArr: { col: number; label: string }[] = []
    weeksArr.forEach((week, col) => {
      const firstDay = week.find(d => d !== null)
      if (!firstDay) return
      const m = firstDay.getMonth()
      if (!seen.has(m)) {
        seen.add(m)
        monthLabelsArr.push({ col, label: MONTHS_ES[m] })
      }
    })

    return { weeks: weeksArr, monthLabels: monthLabelsArr, dataMap: map }
  }, [data])

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) map.set(d.date, d.missions_completed)
    return map
  }, [data])

  const toKey = (d: Date) => d.toISOString().slice(0, 10)

  return (
    <section aria-labelledby="section-heatmap">
      <div className="border-b border-border/40 pb-2 mb-4">
        <h2 id="section-heatmap" className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Actividad
        </h2>
      </div>

      <div className="bg-surface rounded-card p-6 border border-border/60">
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>

            {/* Month labels row */}
            <div style={{ display: 'flex', marginLeft: 24, marginBottom: 4 }}>
              {weeks.map((_, col) => {
                const label = monthLabels.find(m => m.col === col)
                return (
                  <div
                    key={col}
                    style={{ width: 13, flexShrink: 0, fontSize: 10, color: 'var(--color-text-muted)', userSelect: 'none' }}
                  >
                    {label ? label.label : ''}
                  </div>
                )
              })}
            </div>

            {/* Grid: days (rows) × weeks (cols) */}
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
                {DAYS_LABEL.map((d, i) => (
                  <div
                    key={d}
                    style={{
                      width: 12, height: 10, fontSize: 9,
                      color: 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center',
                      visibility: i % 2 === 0 ? 'visible' : 'hidden',
                      userSelect: 'none',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Columns */}
              {weeks.map((week, col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 3 }}>
                  {week.map((day, row) => {
                    if (!day) {
                      return <div key={row} style={{ width: 10, height: 10 }} />
                    }
                    const key = toKey(day)
                    const count = dataMap.get(key) ?? 0
                    const level = getLevel(count)
                    const label = `${count} ${count === 1 ? 'misión completada' : 'misiones completadas'} · ${formatDateEs(key)}`

                    return (
                      <div
                        key={row}
                        role="img"
                        aria-label={label}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          cursor: count > 0 ? 'pointer' : 'default',
                          border: '1px solid rgba(255,255,255,0.04)',
                          ...cellStyle(level),
                        }}
                        onMouseEnter={e => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text: label })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, marginLeft: 24 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Menos</span>
              {([0, 1, 2, 3] as const).map(l => (
                <div
                  key={l}
                  style={{
                    width: 10, height: 10, borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.04)',
                    ...cellStyle(l),
                  }}
                />
              ))}
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Más</span>
            </div>
          </div>
        </div>

        {/* Tooltip — rendered via fixed positioning */}
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
      </div>
    </section>
  )
}
