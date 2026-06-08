import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { Mission, MissionDifficulty, MissionType, LifeClass } from '@/types/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import MissionsClient from '@/components/missions/MissionsClient'
import { AppHeader } from '@/components/ui/AppHeader'

// ─── Seed data ──────────────────────────────────────────────────────────────
// Inserted automatically if the missions table is empty.
// Types match the ENUM values in supabase/schema.sql exactly.
const SEED_MISSIONS: Omit<Mission, 'id'>[] = [
  { title: 'Meditar 10 minutos',   description: 'Usa una app guiada o simplemente siéntate en silencio y respira.',          life_class: 'mental'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 30,   verification: 'manual', required_level: 1, sort_order: 1,    pack: null },
  { title: 'Dormir 7-9 horas',     description: 'Respeta tu ciclo de sueño completo esta noche.',                            life_class: 'fisico'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 40,   verification: 'manual', required_level: 1, sort_order: 2,    pack: null },
  { title: 'Lee 20 páginas',       description: 'Cualquier libro físico o digital. Cuenta como misión completada.',           life_class: 'mental'     as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 45,   verification: 'manual', required_level: 1, sort_order: 3,    pack: null },
  { title: 'Sin móvil 2 horas',    description: 'Desconéctate del teléfono durante 2 horas seguidas. Sin notificaciones.',   life_class: 'disciplina' as LifeClass, difficulty: 'medium' as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 50,   verification: 'manual', required_level: 1, sort_order: 4,    pack: null },
  { title: 'Entrena 30 minutos',   description: 'Realiza cualquier tipo de entrenamiento físico durante al menos 30 minutos.', life_class: 'fisico'   as LifeClass, difficulty: 'easy'   as MissionDifficulty, type: 'daily'       as MissionType, xp_reward: 60,   verification: 'manual', required_level: 1, sort_order: 5,    pack: null },
  { title: 'Correr un 10K',        description: 'Completa una carrera de 10 kilómetros, al aire libre o en cinta.',          life_class: 'fisico'     as LifeClass, difficulty: 'hard'   as MissionDifficulty, type: 'achievement' as MissionType, xp_reward: 1200, verification: 'manual', required_level: 1, sort_order: null, pack: null },
  { title: 'Terminar un libro',    description: 'Lee un libro completo de principio a fin. Cualquier género cuenta.',        life_class: 'mental'     as LifeClass, difficulty: 'medium' as MissionDifficulty, type: 'achievement' as MissionType, xp_reward: 800,  verification: 'manual', required_level: 1, sort_order: null, pack: null },
  { title: 'La semana perfecta',   description: 'Completa todas las misiones diarias durante 7 días consecutivos sin fallar.', life_class: 'disciplina' as LifeClass, difficulty: 'boss'   as MissionDifficulty, type: 'boss'       as MissionType, xp_reward: 750,  verification: 'manual', required_level: 1, sort_order: null, pack: null },
]

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function MissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // ── User profile (needed before mission query for pack filter) ───────────────
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const [profileRes, completedToday] = await Promise.all([
    supabase.from('profiles').select('username, global_level, current_streak, active_pack, feed_public, username_changed_at').eq('id', user.id).single(),
    supabase.from('completed_missions').select('mission_id').eq('user_id', user.id).gte('completed_at', todayUTC.toISOString()),
  ])

  const profile = profileRes.data
  const username      = profile?.username ?? user.email?.split('@')[0] ?? 'jugador'
  const level         = (profile as { global_level?: number } | null)?.global_level ?? 1
  const currentStreak = (profile as { current_streak?: number } | null)?.current_streak ?? 0
  const activePack    = (profile as { active_pack?: string | null } | null)?.active_pack ?? null
  const feedPublic    = (profile as { feed_public?: boolean } | null)?.feed_public ?? true
  const usernameChangedAt = (profile as { username_changed_at?: string | null } | null)?.username_changed_at ?? null

  // ── Fetch missions (daily + streak only — achievements/boss live in /achievements) ──
  let missionsQuery = supabase
    .from('missions')
    .select('*')
    .in('type', ['daily', 'streak'])
    .order('type')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('xp_reward')

  if (activePack) {
    missionsQuery = missionsQuery.or(`type.neq.daily,pack.eq.${activePack}`)
  }

  let { data: missions } = await missionsQuery

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
  const completedTodayIds = completedToday.data?.map((c) => c.mission_id as string) ?? []

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main shell ──────────────────────────────────────────────────── */}
      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">

        <AppHeader
          username={username}
          globalLevel={level}
          profile={{
            username: profile?.username ?? null,
            username_changed_at: usernameChangedAt,
            active_pack: activePack as import('@/types/supabase').PackId | null,
            feed_public: feedPublic,
          }}
        />

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto">
            <MissionsClient
              missions={missions ?? []}
              completedTodayIds={completedTodayIds}
              currentStreak={currentStreak}
            />
          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
