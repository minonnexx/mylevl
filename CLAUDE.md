# mylevl — Contexto del proyecto

## Qué es esto
App de gamificación de hábitos estilo RPG para gamers. El usuario sube de nivel en la vida real completando misiones físicas, mentales y de disciplina. Cada usuario tiene un personaje (avatar) que es su alter ego RPG y con el que interactúa dentro de la app.

## Stack
- Next.js 16.2.7 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4 (tokens en globals.css, NO tailwind.config.ts)
- Supabase (PostgreSQL + Auth + RLS)
- Motion (ex Framer Motion) — animaciones
- Lucide React — iconos SVG
- Sonner — toasts
- Recharts — radar chart
- @dicebear/core + @dicebear/collection — avatares (estilos: adventurer, pixelArt)
- Despliegue en Vercel (plan gratuito)

## Estructura de carpetas
- app/ — rutas y páginas (Server Components por defecto)
- app/api/cron/ — cron jobs (reset-streaks diario)
- components/avatar/ — AvatarDisplay, AvatarCreator
- components/dashboard/ — MissionAreaWrapper, DailyRecapOverlay, ShieldUsedBanner
- components/medals/ — MedalDisplay (HexMedal)
- components/onboarding/ — OnboardingFlow
- components/profile/ — ActivityHeatmap, PackSelector
- components/social/ — FriendList, FriendSearch, FeedItem, PendingRequests, FriendshipButton
- components/ui/ — AppHeader, SettingsDrawer, PageLoader, SplashScreen, AnimatedBar, ShieldIndicator
- lib/ — utilidades, cliente Supabase, constantes
- lib/constants/ — classes.ts, packs.ts, avatar.ts, medals.ts, achievements.ts
- types/ — tipos TypeScript (supabase.ts)

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
- Excepción permitida: colores de datos como rareza de medallas en lib/constants/medals.ts y colores de avatar en lib/constants/avatar.ts
- Sentence case en toda la UI (nunca MAYÚSCULAS en labels)
- No emojis — usar iconos SVG Lucide
- No gradientes ni sombras — superficies planas
- Padding de cards grandes: p-6 / cards compactas: p-4
- Títulos de página: text-2xl font-semibold
- ClassBadge: siempre px-2.5 py-1
- CLASS_META único en lib/constants/classes.ts — nunca duplicar
- PACK_META único en lib/constants/packs.ts — nunca duplicar
- Overlays deben tener listener de tecla Escape para cerrarse
- Nunca mostrar dos overlays simultáneamente — secuenciar con pendingRecapRef
- Touch targets mínimo 44px en móvil

## Navegación
- Móvil: bottom nav (5 items) — Dashboard · Misiones · Logros · Social · Perfil
- Escritorio: sidebar izquierdo
- Header global: AppHeader en todas las páginas con botón de ajustes (icono Settings) a la derecha
- Drawer de ajustes: SettingsDrawer — desliza desde la derecha, cierra con ESC o clic fuera

## Base de datos (Supabase)
### Tablas principales
- profiles: id, username, global_level, current_xp, xp_to_next_level, current_streak, longest_streak, total_days_active, shield_count, shield_used_at, shield_notification_shown, onboarding_completed, date_of_birth, username_changed_at, active_pack, feed_public, avatar_config (jsonb)
- class_progress: user_id, life_class (fisico/mental/disciplina), points
- missions: id, title, description, life_class, difficulty, type, xp_reward, pack, sort_order, verification_type
- completed_missions: user_id, mission_id, completed_at
- streaks: user_id, date, missions_completed, streak_day
- friendships: id, requester_id, addressee_id, status (pending/accepted), created_at
- social_feed: id, user_id, event_type (mission_completed/level_up/streak_milestone), metadata (jsonb), created_at
- medals: id, mission_id, name, icon, rarity, created_at

### Tipos de misiones (missions.type)
- daily — misiones diarias del pack activo del usuario
- boss — misión jefe (semana perfecta a racha 7, gran desafío a 14, imparable a 30)
- achievement — logros únicos

### Tipos de verificación (missions.verification_type)
- automatic — se verifica y completa automáticamente por la app
- manual — el usuario la marca manualmente (con confirmación del avatar)
- external — requiere prueba externa (con confirmación del avatar)

### Pack de misiones (missions.pack)
- guerrero / sabio / monje / heroe / all
- Las misiones daily se filtran por el active_pack del usuario
- Las misiones boss y achievement usan pack = 'all'

## Sistema de progreso

### Nivel global (profiles)
- Fórmula: xp_to_next_level = Math.round(100 * nivel^1.6)
- Implementada en lib/xp.ts — nunca recalcular inline
- El overlay de level up solo se activa al subir nivel global

### Puntos de clase (class_progress)
- Físico, Mental, Disciplina — puntos acumulativos infinitos
- easy → 1 punto, medium → 2, hard → 5, boss → 10
- XP global usa xp_reward de la misión

### Hitos de clase (lib/constants/classes.ts)
- 0-49: Iniciado / 50-149: Practicante / 150-349: Experto / 350-699: Maestro / 700+: Leyenda

### Escudos de racha
- Se gana 1 escudo cada 7 días de racha (máx 3)
- El cron consume un escudo automáticamente si la racha se rompe
- shield_notification_shown controla si el usuario ya vio la notificación de escudo usado
- ShieldIndicator — ring SVG de progreso + inventario

## Sistema de avatares
- Librería: @dicebear/core + @dicebear/collection
- Estilos disponibles: adventurer, pixelArt — el usuario elige en el onboarding
- El usuario puede cambiar su avatar desde ajustes (/avatar) en cualquier momento
- AvatarConfig: { style, gender, skin, hair, hairColor, eyes, mouth? }
- Guardado en profiles.avatar_config (jsonb)
- AvatarDisplay — renderiza el avatar en cualquier tamaño, con fallback a iniciales si avatar_config es null
- AvatarCreator — editor con dos pasos: elegir estilo → personalizar rasgos
- El avatar aparece en: dashboard header, perfil, perfil público, social, ajustes
- NUNCA superponer capas de ropa sobre el avatar (eliminado)

## Sistema social
- Límite de 20 amigos por usuario
- friendships: pending → accepted
- feed_public en profiles controla si el feed es visible para no-amigos
- Perfiles públicos /u/[username] — solo accesibles para usuarios autenticados
- Feed muestra solo actividad de amigos, no propia
- Eventos de feed: mission_completed, level_up, streak_milestone
- Badge de notificación en nav cuando hay solicitudes pendientes
- getPendingRequests(), getFriends(), getFeed(), searchUser() — en app/social/actions.ts
- searchUser usa .ilike() — búsqueda case-insensitive

## Sistema de medallas y logros
- Cada logro (achievement/boss) tiene una medalla asociada en la tabla medals
- MedalDisplay (HexMedal) — hexágono SVG con icono Lucide centrado y color por rareza
- Rarezas: common / uncommon / rare / epic / legendary
- RARITY_META en lib/constants/medals.ts — única fuente de verdad de colores de rareza
- Colores de rareza (hex permitidos como datos): common #888784, uncommon #1D9E75, rare #4A90D9, epic #7F77DD, legendary #D4A843
- Los logros automáticos NO tienen botón de completar — se verifican en lib/achievements.ts
- Los logros manual/external muestran el modal de confirmación del avatar antes de completar
- checkAutoAchievements() se llama al completar misiones y en el cron diario
- Títulos de logros automáticos centralizados en lib/constants/achievements.ts — nunca hacer string matching directo
- Medallas visibles en: /achievements, /profile, /u/[username]

## Packs de misiones
- PACK_META en lib/constants/packs.ts — única fuente de verdad
- guerrero: Físico (5 misiones) / sabio: Mental (5) / monje: Disciplina (5) / heroe: los tres (6)
- El usuario elige pack en onboarding y puede cambiarlo desde ajustes sin límite
- Las misiones daily se filtran por active_pack en dashboard y misiones

## Onboarding (5 pasos)
1. Bienvenida — "Tu aventura empieza aquí"
2. Nombre de héroe + fecha de nacimiento (mín 13 años, máx 80 años)
3. Crear personaje — AvatarCreator
4. El personaje habla — momento inmersivo con typewriter
5. Elegir pack — "Elige tu camino"
- Username: único, case-insensitive check, límite de cambio 30 días (username_changed_at)
- completeOnboarding() en app/onboarding/actions.ts guarda username, date_of_birth, avatarConfig, activePack

## Recap
- Overlay diario en dashboard — una vez por día via sessionStorage (key: recap-shown-[fecha])
- Página /recap con tres vistas: Hoy / Esta semana / Este mes
- getDaySummary() en lib/recap.ts — single source of truth para el recap diario
- Las misiones daily del recap se filtran por active_pack del usuario
- DailyRecapOverlay puramente presentacional — sessionStorage guard en el padre

## Cron diario (app/api/cron/reset-streaks/route.ts)
- Ejecuta a las 00:05 UTC
- Reset de rachas, consumo de escudos, streak_milestones en social_feed
- Llama a checkAutoAchievements() para cada usuario activo
- shield_notification_shown se resetea a false al consumir un escudo

## Archivos clave — fuentes de verdad
- lib/xp.ts — fórmula de nivel
- lib/constants/classes.ts — CLASS_META e hitos
- lib/constants/packs.ts — PACK_META
- lib/constants/avatar.ts — SKIN_TONES, HAIR_COLORS, opciones por estilo
- lib/constants/medals.ts — RARITY_META
- lib/constants/achievements.ts — títulos de logros automáticos
- lib/shields.ts — lógica de escudos
- lib/sounds.ts — Web Audio API con cola de sonidos
- lib/recap.ts — getDaySummary()
- lib/streaks.ts — lógica de rachas
- lib/achievements.ts — checkAutoAchievements()
- app/dashboard/actions.ts — Server Action principal del dashboard
- app/missions/actions.ts — Server Action de misiones
- app/social/actions.ts — Server Actions del sistema social
- app/profile/actions.ts — changeActivePack(), updateAvatarConfig()
- app/avatar/actions.ts — updateAvatarConfig()

## Loader y splash
- PageLoader — componente en components/ui/PageLoader.tsx — texto "mylevl" + barra animada
- app/loading.tsx — loader global único que usa PageLoader — NO crear loading.tsx individuales por ruta
- SplashScreen — aparece solo la primera vez que se abre la app en una sesión (sessionStorage: splash-shown)

## Lo que NO hacer
- No crear tailwind.config.ts
- No usar colores hex directos en componentes (excepción: datos de rareza/avatar en lib/constants/)
- No duplicar lógica de XP fuera de lib/xp.ts
- No duplicar CLASS_META, PACK_META, RARITY_META fuera de sus archivos canónicos
- No usar localStorage — usar Supabase o sessionStorage según el caso
- No mostrar dos overlays simultáneamente
- No hacer string matching contra títulos de misiones — usar lib/constants/achievements.ts
- No superponer ropa sobre avatares DiceBear
- No crear loading.tsx individuales por ruta — usar app/loading.tsx global
- No gradientes ni sombras en ningún componente
- No emojis en la UI

## Lo que DEBES hacer
- Escribirme siempre en español
- Usar var(--color-*) para todos los colores de UI
- Añadir listener de ESC en todos los overlays y drawers
- Llamar a checkAutoAchievements() después de completar cualquier misión
- Insertar eventos en social_feed al completar misiones, subir de nivel o alcanzar hitos de racha
- Mostrar modal de confirmación del avatar antes de completar logros manual/external
- Seguir el patrón de Server Components + Server Actions — sin API REST
- Al completar cualquier feature nueva, incluir PageLoader en components/PageLoader si hace falta
- Respetar el límite de 20 amigos en todas las operaciones de friendships
- Filtrar misiones daily por active_pack en todas las queries que las usen