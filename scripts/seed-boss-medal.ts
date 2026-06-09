/**
 * Seeds the "Sin fisuras" epic medal for the boss mission "La semana perfecta".
 * Run: npx tsx --env-file=.env.local scripts/seed-boss-medal.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of content.split('\n')) {
      const stripped = line.trim()
      if (!stripped || stripped.startsWith('#')) continue
      const eqIdx = stripped.indexOf('=')
      if (eqIdx === -1) continue
      const key = stripped.slice(0, eqIdx).trim()
      let val = stripped.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.warn('Could not load .env.local — using existing process.env')
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Find the boss mission (title contains "semana perfecta", case-insensitive)
  const { data: missions, error: mErr } = await supabase
    .from('missions')
    .select('id, title, type')
    .eq('type', 'boss')
    .ilike('title', '%semana perfecta%')

  if (mErr) { console.error('Error querying missions:', mErr.message); process.exit(1) }
  if (!missions || missions.length === 0) {
    console.log('✗ No boss mission matching "semana perfecta" found.')
    process.exit(0)
  }

  const mission = missions[0]
  console.log(`Found boss mission: "${mission.title}" (${mission.id})`)

  // Check if medal already exists
  const { data: existing } = await supabase
    .from('medals')
    .select('id, name')
    .eq('mission_id', mission.id)
    .maybeSingle()

  if (existing) {
    console.log(`✓ Medal already exists: "${existing.name}" — nothing to do.`)
    process.exit(0)
  }

  // Insert the medal
  const { error: insErr } = await supabase.from('medals').insert({
    mission_id: mission.id,
    name: 'Sin fisuras',
    icon: 'Shield',
    rarity: 'epic',
  })

  if (insErr) {
    console.error('Error inserting medal:', insErr.message)
    process.exit(1)
  }

  console.log('✓ Medal "Sin fisuras" (Shield, epic) created for mission "' + mission.title + '"')
}

main().catch(e => { console.error(e); process.exit(1) })
