'use client'

import { useMemo, useState } from 'react'

type DayData = { date: string; missions_completed: number }
type Props = { data: DayData[] }

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

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTHS_ES_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) map.set(d.date, d.missions_completed)
    return map
  }, [data])

  // Build the sliding-window grid
  const { weeks, monthLabels, activeDays } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Window start: 364 days ago (so today is day 365), rewound to that day's Monday
    const windowStart = new Date(today)
    windowStart.setDate(today.getDate() - 364)
    const offsetToMonday = isoWeekday(windowStart) // days since last Monday
    windowStart.setDate(windowStart.getDate() - offsetToMonday)

    // Build weeks array: each entry = array of 7 Date|null
    // null means the slot is before the window start or after today
    const weeksArr: (Date | null)[][] = []
    const cur = new Date(windowStart)

    while (cur <= today) {
      const col: (Date | null)[] = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur)
        day.setDate(cur.getDate() + d)
        // only include days within the 365-day window and not in the future
        col.push(day <= today ? day : null)
      }
      weeksArr.push(col)
      cur.setDate(cur.getDate() + 7)
    }

    // Month labels: one per month, placed at the first col where that month appears
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

    let active = 0
    for (const col of weeksArr) {
      for (const day of col) {
        if (day && (dataMap.get(toKey(day)) ?? 0) > 0) active++
      }
    }

    return { weeks: weeksArr, monthLabels: labels, activeDays: active }
  }, [dataMap])

  const DAY_LABEL_W = 14
  const DAY_LABEL_GAP = 6
  const MONTH_ROW_H = 16

  const totalWeeks = weeks.length
  const gridW = totalWeeks * CELL + Math.max(0, totalWeeks - 1) * GAP

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
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>

            {/* Month labels row */}
            <div
              style={{
                display: 'flex',
                height: MONTH_ROW_H,
                marginLeft: DAY_LABEL_W + DAY_LABEL_GAP,
                position: 'relative',
                width: gridW,
              }}
            >
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

            {/* Main grid row: day labels + week columns */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: DAY_LABEL_GAP }}>

              {/* Day labels — each cell exactly CELL height + GAP, matching rows */}
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

              {/* Week columns */}
              <div style={{ display: 'flex', gap: GAP }}>
                {weeks.map((col, colIdx) => (
                  <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                    {col.map((day, rowIdx) => {
                      if (!day) {
                        // empty slot (before window start, beginning of first week)
                        return (
                          <div
                            key={rowIdx}
                            style={{ width: CELL, height: CELL, flexShrink: 0 }}
                          />
                        )
                      }

                      const key = toKey(day)
                      const count = dataMap.get(key) ?? 0
                      const level = getLevel(count)
                      const tooltipText = `${count} ${count === 1 ? 'misión completada' : 'misiones completadas'} · ${day.getDate()} ${MONTHS_ES_SHORT[day.getMonth()]} ${day.getFullYear()}`

                      const bgStyle: React.CSSProperties = level === 0
                        ? {
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
                          }
                        : {
                            backgroundColor: `color-mix(in srgb, var(--color-accent) ${level === 1 ? 30 : level === 2 ? 60 : 100}%, transparent)`,
                            border: '1px solid transparent',
                          }

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
                            ...bgStyle,
                          }}
                          onMouseEnter={e => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              text: tooltipText,
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 10,
                marginLeft: DAY_LABEL_W + DAY_LABEL_GAP,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: gridW,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {activeDays} {activeDays === 1 ? 'día activo' : 'días activos'} en el último año
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Menos</span>
                {([0, 1, 2, 3] as const).map(l => {
                  const s: React.CSSProperties = l === 0
                    ? {
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
                      }
                    : {
                        backgroundColor: `color-mix(in srgb, var(--color-accent) ${l === 1 ? 30 : l === 2 ? 60 : 100}%, transparent)`,
                        border: '1px solid transparent',
                      }
                  return (
                    <div
                      key={l}
                      style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, ...s }}
                    />
                  )
                })}
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Más</span>
              </div>
            </div>
          </div>
        </div>
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
