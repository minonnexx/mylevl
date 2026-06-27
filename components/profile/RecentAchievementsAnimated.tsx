'use client'

import { motion } from 'motion/react'
import { Trophy } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import { EmptyState } from '@/components/ui/EmptyState'
import type { LifeClass } from '@/types/supabase'

type RecentItem = {
  completed_at: string
  missions: { title: string; xp_reward: number; life_class: string } | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const missionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((todayMidnight.getTime() - missionDay.getTime()) / 86400000)
  if (diffDays === 0) return `Hoy · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function RecentAchievementsAnimated({ recent }: { recent: RecentItem[] }) {
  if (recent.length === 0) {
    return (
      <div className="bg-surface rounded-card border border-border/60">
        <EmptyState
          icon={<Trophy size={40} strokeWidth={1.5} aria-hidden />}
          title="Aún sin logros"
          description="Completa misiones para ver tu progreso aquí"
          action={{ label: 'Ver misiones', href: '/missions' }}
        />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
      {recent.map((item, idx) => {
        const mission = item.missions
        if (!mission) return null
        const lc = mission.life_class as LifeClass
        const meta = CLASS_META[lc] ?? CLASS_META.fisico

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut', delay: idx * 0.07 }}
            className={`flex items-center gap-4 px-6 py-4 ${idx < recent.length - 1 ? 'border-b border-border/40' : ''}`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: meta.color }}
              aria-hidden
            />
            <p className="flex-1 text-sm font-medium text-text-primary truncate min-w-0">
              {mission.title}
            </p>
            <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill flex-shrink-0 ${meta.badgeClasses}`}>
              {meta.label}
            </span>
            <span className="text-sm font-black text-accent tabular-nums flex-shrink-0">
              +{mission.xp_reward} XP
            </span>
            <span className="hidden md:block text-xs text-text-muted flex-shrink-0 w-28 text-right">
              {formatDate(item.completed_at)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
