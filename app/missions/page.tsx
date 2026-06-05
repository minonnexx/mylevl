import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { Mission, MissionDifficulty, MissionType, LifeClass } from '@/types/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import MissionsClient from '@/components/missions/MissionsClient'

// ─── Seed data ──────────────────────────────────────────────────────────────
// Inserted automatically if the missions table is empty.
// Types match the ENUM values in supabase/schema.sql exactly.
const SEED_MISSIONS: Omit<Mission, 'id'>[] = [
  { title: 'Meditar 10 minutos',   description: 'Usa una app guiada o simplemente siéntate en silencio y respira.',          life_class: 'mental'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 30,   verification: 'manual', required_level: 1, sort_order: 1 },
  { title: 'Dormir 7-9 horas',     description: 'Respeta tu ciclo de sueño completo esta noche.',                            life_class: 'fisico'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 40,   verification: 'manual', required_level: 1, sort_order: 2 },
  { title: 'Lee 20 páginas',       description: 'Cualquier libro físico o digital. Cuenta como misión completada.',           life_class: 'mental'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 45,   verification: 'manual', required_level: 1, sort_order: 3 },
  { title: 'Sin móvil 2 horas',    description: 'Desconéctate del teléfono durante 2 horas seguidas. Sin notificaciones.',   life_class: 'disciplina' as LifeClass, difficulty: 'medium' as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 50,   verification: 'manual', required_level: 1, sort_order: 4 },
  { title: 'Entrena 30 minutos',   description: 'Realiza cualquier tipo de entrenamiento físico durante al menos 30 minutos.', life_class: 'fisico'   as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 60,   verification: 'manual', required_level: 1, sort_order: 5 },
  { title: 'Correr un 10K',        description: 'Completa una carrera de 10 kilómetros, al aire libre o en cinta.',          life_class: 'fisico'     as LifeClass, difficulty: 'hard'   as MissionDifficulty, type: 'achievement' as MissionType, xp_reward: 1200, verification: 'manual', required_level: 1, sort_order: null },
  { title: 'Terminar un libro',    description: 'Lee un libro completo de principio a fin. Cualquier género cuenta.',        life_class: 'mental'     as LifeClass, difficulty: 'medium' as MissionDifficulty, type: 'achievement' as MissionType, xp_reward: 800,  verification: 'manual', required_level: 1, sort_order: null },
  { title: 'La semana perfecta',   description: 'Completa todas las misiones diarias durante 7 días consecutivos sin fallar.', life_class: 'disciplina' as LifeClass, difficulty: 'boss'   as MissionDifficulty, type: 'boss'       as MissionType, xp_reward: 750,  verification: 'manual', required_level: 1, sort_order: null },
]

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function MissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // ── Fetch missions ────────────────────────────────────────────────────────
  let { data: missions } = await supabase
    .from('missions')
    .select('*')
    .order('type')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('xp_reward')

  // ── Auto-seed if empty (requires SUPABASE_SERVICE_ROLE_KEY) ───────────────
  if (!missions?.length) {
    try {
      const admin = createAdminClient()
      await admin.from('missions').insert(SEED_MISSIONS)
      const { data: seeded } = await admin.from('missions').select('*').order('xp_reward')
      missions = seeded
    } catch {
      // Service role key not configured — missions will be empty
    }
  }

  // ── Completed today (UTC midnight boundary) ────────────────────────────────
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const { data: completedToday } = await supabase
    .from('completed_missions')
    .select('mission_id')
    .eq('user_id', user.id)
    .gte('completed_at', todayUTC.toISOString())

  const completedTodayIds = completedToday?.map((c) => c.mission_id as string) ?? []

  // ── User profile (for header) ──────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, global_level, current_streak')
    .eq('id', user.id)
    .single()

  const username      = profile?.username ?? user.email?.split('@')[0] ?? 'jugador'
  const level         = (profile as { global_level?: number } | null)?.global_level ?? 1
  const currentStreak = (profile as { current_streak?: number } | null)?.current_streak ?? 0

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main shell ──────────────────────────────────────────────────── */}
      <div className="ml-16 flex-1 flex flex-col min-h-screen">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 h-14 px-8 flex items-center justify-between"
          style={{
            background: 'rgba(14,14,16,0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span className="font-semibold text-text-primary tracking-tight">Logros Reales</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{username}</span>
            <span className="text-xs font-bold text-accent bg-accent/12 border border-accent/20 px-3 py-1 rounded-pill tabular-nums">
              LVL {level}
            </span>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 py-8 px-8">
          <div className="max-w-[1100px] mx-auto">
            <MissionsClient
              missions={missions ?? []}
              completedTodayIds={completedTodayIds}
              currentStreak={currentStreak}
            />
          </div>
        </main>

      </div>
    </div>
  )
}
