'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props {
  fisico: number
  mental: number
  disciplina: number
}

function normalize(points: number): number {
  if (points < 50) return (points / 50) * 100
  if (points < 150) return ((points - 50) / 100) * 100
  if (points < 350) return ((points - 150) / 200) * 100
  if (points < 700) return ((points - 350) / 350) * 100
  return 100
}

export function ClassRadarChart({ fisico, mental, disciplina }: Props) {
  const data = [
    { class: 'Físico', value: normalize(fisico) },
    { class: 'Mental', value: normalize(mental) },
    { class: 'Disciplina', value: normalize(disciplina) },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--color-border-tertiary)" />
        <PolarAngleAxis
          dataKey="class"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
        />
        <Radar
          dataKey="value"
          stroke="var(--color-text-primary)"
          fill="var(--color-text-primary)"
          fillOpacity={0.15}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
