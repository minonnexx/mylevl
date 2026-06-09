/**
 * One-time script: removes duplicate missions from Supabase.
 * Run: npx tsx --env-file=.env.local scripts/fix-mission-duplicates.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Manual .env.local loader (no dotenv dependency needed)
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
  const { data: missions, error } = await supabase
    .from('missions')
    .select('id, title, type, xp_reward')
    .order('title')

  if (error || !missions) {
    console.error('Error fetching missions:', error?.message)
    process.exit(1)
  }

  // Group by title (case-insensitive)
  const byTitle = new Map<string, typeof missions>()
  for (const m of missions) {
    const key = (m.title as string).toLowerCase().trim()
    if (!byTitle.has(key)) byTitle.set(key, [])
    byTitle.get(key)!.push(m)
  }

  let totalDeleted = 0

  for (const [title, group] of byTitle) {
    if (group.length <= 1) continue

    console.log(`\nDuplicate found: "${title}" (${group.length} entries)`)
    group.forEach(m => console.log(`  id=${m.id}  type=${m.type}  xp=${m.xp_reward}`))

    // Keep preference: boss > achievement > daily — then by first id alphabetically
    const priority = ['boss', 'achievement', 'streak', 'daily']
    const toKeep = group.sort((a, b) => {
      const pa = priority.indexOf(a.type as string)
      const pb = priority.indexOf(b.type as string)
      if (pa !== pb) return pa - pb
      return (a.id as string).localeCompare(b.id as string)
    })[0]

    const toDelete = group.filter(m => m.id !== toKeep.id).map(m => m.id as string)
    console.log(`  → Keeping: ${toKeep.id} (type=${toKeep.type})`)
    console.log(`  → Deleting: ${toDelete.join(', ')}`)

    const { error: delErr } = await supabase.from('missions').delete().in('id', toDelete)
    if (delErr) {
      console.error(`  ✗ Delete error: ${delErr.message}`)
    } else {
      console.log(`  ✓ Deleted ${toDelete.length} duplicate(s)`)
      totalDeleted += toDelete.length
    }
  }

  if (totalDeleted === 0) {
    console.log('\n✓ No duplicates found — nothing to delete.')
  } else {
    console.log(`\n✓ Done — ${totalDeleted} duplicate(s) removed.`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
