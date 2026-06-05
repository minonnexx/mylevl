# mylevl — Contexto del proyecto

## Qué es esto
App de gamificación de hábitos estilo RPG para gamers. El usuario sube de nivel en la vida real completando misiones físicas, mentales y de disciplina.

## Stack
- Next.js 15 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4 (tokens en globals.css, NO tailwind.config.ts)
- Supabase (PostgreSQL + Auth + RLS)
- Despliegue local en localhost:3000

## Estructura de carpetas
- app/ — rutas y páginas (Server Components por defecto)
- components/ — componentes reutilizables
- lib/ — utilidades, cliente Supabase, constantes
- types/ — tipos TypeScript

## Tokens de diseño (globals.css)
- --color-background: #0E0E10
- --color-surface: #1A1A1D
- --color-accent: #7F77DD (purple)
- --color-fisico: #1D9E75 (green)
- --color-mental: #7F77DD (purple)
- --color-disciplina: #BA7517 (amber)
- --color-text-primary: #F2F2F0
- --color-text-muted: #888784
- --radius-card: 12px
- --radius-component: 8px
- --radius-pill: 20px

## Reglas de diseño — SIEMPRE seguir
- Nunca hardcodear colores hex — usar siempre var(--color-*)
- Sentence case en toda la UI (nunca MAYÚSCULAS en labels)
- No emojis — usar iconos SVG (Lucide)
- No gradientes ni sombras — superficies planas
- padding de cards: siempre p-6
- Títulos de página: text-2xl font-semibold
- ClassBadge: siempre px-2.5 py-1
- CLASS_META único en lib/constants/classes.ts — nunca duplicar

## Base de datos (Supabase)
Tablas: profiles, class_progress, missions, completed_missions, streaks

- profiles: id, username, global_level, current_xp, xp_to_next_level, current_streak, longest_streak, total_days_active
- class_progress: user_id, life_class (fisico/mental/disciplina), points (acumulativo infinito, NO niveles)
- missions: id, title, description, life_class, difficulty, type, xp_reward, verification, sort_order
- completed_missions: user_id, mission_id, completed_at
- streaks: user_id, date, missions_completed, streak_day

## Sistema de progreso

### Nivel global (profiles)
- Un solo nivel global por jugador
- Fórmula: xp_to_next_level = Math.round(100 * nivel^1.6)
- Implementada en lib/xp.ts — nunca recalcular inline
- El overlay de level up solo se activa al subir nivel global

### Puntos de clase (class_progress)
- Físico, Mental, Disciplina son puntos acumulativos infinitos, NO niveles
- Se incrementan según dificultad de la misión completada:
  easy → 1 punto, medium → 2, hard → 5, boss → 10
- El XP global sigue usando xp_reward de la misión

### Hitos de clase (lib/constants/classes.ts)
- 0-49: Iniciado
- 50-149: Practicante
- 150-349: Experto
- 350-699: Maestro
- 700+: Leyenda

### Botón de reset (solo development)
- En app/profile/page.tsx — solo visible con NODE_ENV=development
- Server action en app/profile/actions.ts
- Eliminar antes del deploy a producción

## Clases de vida
Definidas en lib/constants/classes.ts — única fuente de verdad
Nunca definir CLASS_META localmente en un componente o página

## Lo que NO hacer
- No crear tailwind.config.ts (el proyecto usa Tailwind v4)
- No usar colores hex directos en componentes
- No duplicar lógica de XP fuera de lib/xp.ts
- No duplicar CLASS_META fuera de lib/constants/classes.ts
- No usar bottom navigation (es webapp de escritorio)
- No usar localStorage (usar Supabase)