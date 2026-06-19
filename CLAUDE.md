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
- Dominio: mylevl.app

## Estructura de carpetas
- app/ — rutas y páginas (Server Components por defecto)
- app/api/cron/ — cron jobs (reset-streaks diario)
- app/api/waitlist/ — endpoint para lista de espera (Brevo)
- app/u/[username]/ — perfil público editable por su dueño
- app/social/leagues/[leagueId]/ — vista interior de liga
- components/avatar/ — AvatarDisplay, AvatarCreator
- components/dashboard/ — MissionAreaWrapper, DailyRecapOverlay, ShieldUsedBanner
- components/medals/ — MedalDisplay (HexMedal)
- components/onboarding/ — OnboardingFlow
- components/profile/ — ActivityHeatmap, PackSelector, MedalsGrid, PublicProfileContent
- components/social/ — FriendList, FriendSearch, FeedItem, PendingRequests, FriendshipButton
- components/ui/ — AppHeader, SettingsDrawer, PageLoader, SplashScreen, AnimatedBar, ShieldIndicator, MedalUnlockOverlay, MedalDetailModal, AvatarConfirmModal, AvatarSpeechBubble
- lib/ — utilidades, cliente Supabase, constantes
- lib/constants/ — classes.ts, packs.ts, avatar.ts, medals.ts, achievements.ts, leagues.ts, challenges.ts
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
- Borde izquierdo de 3px en cards de misiones y logros con color de clase
- Opacidad invertida: completadas opacity-40, pendientes opacidad completa

## Navegación
- Móvil: bottom nav (5 items) — Dashboard · Misiones · Logros · Social · Perfil
- Escritorio: sidebar izquierdo
- Header global: AppHeader en todas las páginas con isotipo ML (logo-512.png) y botón de ajustes (icono Settings) a la derecha
- Drawer de ajustes: SettingsDrawer — desliza desde la derecha, cierra con ESC o clic fuera

## Base de datos (Supabase)
### Tablas principales
- profiles: id, username, global_level, current_xp, xp_to_next_level, current_streak, longest_streak, total_days_active, shield_count, shield_used_at, shield_notification_shown, onboarding_completed, date_of_birth, username_changed_at, active_pack, feed_public, avatar_config (jsonb), avatar_confirmation_shown, profile_show_medals, pinned_medals (uuid[])
- class_progress: user_id, life_class (fisico/mental/disciplina), points
- missions: id, title, description, life_class, difficulty, type, xp_reward, pack, sort_order, verification_type
- completed_missions: user_id, mission_id, completed_at
- streaks: user_id, date, missions_completed, streak_day
- friendships: id, requester_id, addressee_id, status (pending/accepted), created_at
- social_feed: id, user_id, event_type (mission_completed/level_up/streak_milestone), metadata (jsonb), created_at
- medals: id, mission_id, name, icon, rarity, unlock_percentage, created_at
- leagues: id, name, created_by, created_at
- league_members: id, league_id, user_id, status (pending/accepted), joined_at
- league_weekly_stats: id, league_id, user_id, week_start, xp_earned, missions_completed
- weekly_challenges: id, week_start, challenge_key, created_at
- challenge_completions: id, user_id, week_start, completed_at
- custom_missions: id, user_id, title, life_class, difficulty, xp_reward, duration, starts_at, ends_at, active, strict_mode, created_at
- custom_mission_completions: id, user_id, custom_mission_id, completed_date, completed_at
- custom_mission_milestones: id, user_id, custom_mission_id, milestone_days, achieved_at

### RLS importante — funciones SECURITY DEFINER
Las tablas de ligas requieren funciones auxiliares para evitar recursión infinita:
```sql
get_user_league_ids(uid) -- IDs de ligas del usuario
get_user_league_ids_accepted(uid) -- solo ligas aceptadas
get_all_user_league_ids(uid) -- todas las ligas
is_league_member(lid, uid) -- si el usuario es miembro accepted
```
ESTAS FUNCIONES DEBEN EXISTIR en Supabase para que las ligas funcionen.

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
- Pack heroe: 6 misiones (2 por clase)

## Sistema de progreso

### Nivel global (profiles)
- Fórmula: xp_to_next_level = Math.round(100 * nivel^1.6)
- Implementada en lib/xp.ts — nunca recalcular inline
- El overlay de level up solo se activa al subir nivel global
- Al subir nivel el avatar aparece con mensaje motivador (AvatarSpeechBubble)
- Secuencia: level up overlay → recap overlay (nunca simultáneos)

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
- Los avatares son clicables y navegan al perfil público del usuario
- NUNCA superponer capas de ropa sobre el avatar (eliminado)
- AvatarSpeechBubble — componente reutilizable para avatar + burbuja de texto animada

## Sistema social
- Límite de 20 amigos por usuario
- friendships: pending → accepted
- feed_public en profiles controla si el feed es visible para no-amigos
- Perfiles públicos /u/[username] — solo accesibles para usuarios autenticados
- Feed muestra solo actividad de amigos, no propia
- Eventos de feed: mission_completed, level_up, streak_milestone
- Badge de notificación en nav: accent (purple) para solicitudes de amistad, disciplina (amber) para invitaciones a liga. Prioridad a amistad si hay ambas
- getPendingRequests(), getFriends(), getFeed(), searchUser() — en app/social/actions.ts
- searchUser usa .ilike() — búsqueda case-insensitive

## Sistema de medallas y logros
- Cada logro (achievement/boss) tiene una medalla asociada en la tabla medals
- MedalDisplay (HexMedal) — hexágono SVG con icono Lucide centrado y color por rareza
- Rarezas: common / uncommon / rare / epic / legendary
- RARITY_META en lib/constants/medals.ts — única fuente de verdad de colores de rareza
- Colores de rareza (hex permitidos como datos): common #888784, uncommon #1D9E75, rare #4A90D9, epic #7F77DD, legendary #D4A843
- unlock_percentage en medals — se recalcula cada noche en el cron
- MedalUnlockOverlay — overlay de celebración al desbloquear medalla con porcentaje
- MedalDetailModal — modal al pulsar una medalla con nombre, rareza y porcentaje
- Los logros automáticos NO tienen botón de completar — se verifican en lib/achievements.ts
- Los logros manual/external muestran AvatarConfirmModal antes de completar
- avatar_confirmation_shown en profiles — animación completa solo la primera vez
- checkAutoAchievements() se llama al completar misiones y en el cron diario
- Títulos de logros automáticos centralizados en lib/constants/achievements.ts — nunca hacer string matching directo
- Medallas visibles en: /achievements, /profile, /u/[username]

## Perfil público (/u/[username])
- PublicProfileContent — componente cliente que gestiona vista y edición
- Si el usuario logueado es el dueño → botón "Editar perfil" visible
- Edición in-place: toggle para mostrar/ocultar medallas, selector de hasta 3 medallas fijadas
- profile_show_medals y pinned_medals en profiles
- Medallas fijadas aparecen destacadas (HexMedal size=56) encima del grid
- MedalsGrid — grid de todas las medallas desbloqueadas con MedalDetailModal al pulsar

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
5. Elegir pack — "Elige tu camino" + hint sobre Mis misiones
- Navegación hacia atrás disponible desde paso 2 en adelante (botón ← Volver arriba a la izquierda)
- Todo el estado se guarda en local hasta el paso final — un solo completeOnboarding() al terminar
- Username: único, case-insensitive check, límite de cambio 30 días (username_changed_at)
- completeOnboarding() en app/onboarding/actions.ts guarda username, date_of_birth, avatarConfig, activePack de una vez

## Recap
- Overlay diario en dashboard — una vez por día via sessionStorage (key: recap-shown-[fecha])
- El avatar aparece en el recap con mensaje motivador (AvatarSpeechBubble)
- Página /recap con tres vistas: Hoy / Esta semana / Este mes
- getDaySummary() en lib/recap.ts — single source of truth para el recap diario
- Las misiones daily del recap se filtran por active_pack del usuario
- DailyRecapOverlay puramente presentacional — sessionStorage guard en el padre

## Sistema de ligas
- Grupos de competición privados entre amigos (máx 10 miembros)
- LEAGUE_PRESET_NAMES y LEAGUE_MOTIVATIONAL_MESSAGES en lib/constants/leagues.ts
- Mensajes motivadores individuales para top1, top2, top3, mid, last
- Leaderboard semanal calculado en tiempo real desde completed_missions (no espera al cron)
- Score = XP ganada esta semana + misiones completadas
- Reset automático cada lunes en el cron
- Cualquier miembro puede invitar a sus amigos (máx 9 además del creador)
- Botón para añadir como amigo a miembros de la liga que no tengas agregados
- Sección en /social entre búsqueda y feed

## Desafío semanal
- Pool de 4 desafíos en lib/constants/challenges.ts — rota automáticamente cada lunes
- Tipos: count (misiones/logros de una clase), streak (días consecutivos), xp (XP ganada)
- Barra de progreso en tiempo real
- Medalla epic al completar + XP bonus
- Contador de jugadores que lo completaron (visible solo tras completarlo)
- Visible en dashboard y en /achievements junto a los jefes semanales

## Mis misiones (misiones personalizadas)
- El usuario crea sus propias misiones con título, clase, dificultad, duración y modo estricto
- Límite de 1 misión activa en plan gratuito
- Modo estricto: si fallas un día, la racha se reinicia a 0
- Aviso visual "Racha reiniciada" el día después de fallar en modo estricto
- Aviso "¡Complétala hoy!" si son más de las 20:00 y no está completada en modo estricto
- Hitos automáticos a 7, 30 y 90 días con medalla epic y XP bonus
- XP según dificultad: easy→10, medium→20, hard→40
- Duración: 7/30/90 días o indefinido
- Aparece en dashboard si hay misiones creadas, sección "Mis misiones" en /missions
- custom_mission_completions usa completed_date (DATE) para evitar duplicados diarios

## Botones de completar — patrón estándar
- Optimistic update — se marca como completado instantáneamente en estado local
- toast.loading("Calculando recompensa...") inmediatamente
- Server Action en background
- Al resolver → toast.dismiss() + overlays de XP/nivel si corresponde
- isProcessing bloquea todos los botones de completar mientras procesa
- Aplicado en /missions, /achievements y dashboard

## Cron diario (app/api/cron/reset-streaks/route.ts)
- Ejecuta a las 00:05 UTC
- Reset de rachas, consumo de escudos, streak_milestones en social_feed
- Llama a checkAutoAchievements() para cada usuario activo
- Recalcula unlock_percentage de todas las medallas
- Crea fila en weekly_challenges para la nueva semana cada lunes
- Reset de league_weekly_stats cada lunes
- shield_notification_shown se resetea a false al consumir un escudo

## Landing page (mylevl.app)
- Usuario no autenticado → ve landing (/)
- Usuario autenticado → redirige a dashboard (/dashboard)
- Autenticación gestionada por proxy.ts — NO crear middleware.ts
- Secciones: hero, el problema, la solución, próximamente, apoya el proyecto, lista de espera, footer
- Lista de espera integrada con Brevo (lista ID 2) via /api/waitlist
- Patreon: https://www.patreon.com/cw/mylevl
- Registro cerrado — solo con INVITE_CODE (variable de entorno en Vercel)
- Login acepta email o username en el mismo campo
- Email de bienvenida automático via Brevo automation al apuntarse

## Assets y logo
- Nombre de la app: MyLevl (M y L mayúsculas)
- public/logo-512.png — logo completo con fondo oscuro (icono PWA, favicon, splash)
- public/logo-192.png — logo 192x192 (PWA manifest)
- public/favicon.png — favicon 32x32
- public/logo-text.png — solo el texto "MYLEVL" para PageLoader
- public/logo.svg — SVG con problemas de color, usar PNG mejor
- Header de la app: isotipo ML recortado de logo-512.png (object-position: top)
- SVG del logo tiene problemas de colores tras vectorización — siempre usar PNG

## Variables de entorno (Vercel)
- INVITE_CODE — código secreto para registro
- BREVO_API_KEY — API key de Brevo para lista de espera
- REGISTRATION_OPEN=false

## Loader y splash
- PageLoader — components/ui/PageLoader.tsx — logo-text.png (texto MYLEVL) + barra animada
- app/loading.tsx — loader global único — NO crear loading.tsx individuales por ruta
- SplashScreen — logo-512.png completo, aparece solo la primera vez en cada sesión (sessionStorage: splash-shown)

## Archivos clave — fuentes de verdad
- lib/xp.ts — fórmula de nivel
- lib/constants/classes.ts — CLASS_META e hitos
- lib/constants/packs.ts — PACK_META
- lib/constants/avatar.ts — SKIN_TONES, HAIR_COLORS, opciones por estilo
- lib/constants/medals.ts — RARITY_META
- lib/constants/achievements.ts — títulos de logros automáticos
- lib/constants/leagues.ts — LEAGUE_PRESET_NAMES, LEAGUE_MOTIVATIONAL_MESSAGES
- lib/constants/challenges.ts — CHALLENGE_POOL
- lib/shields.ts — lógica de escudos
- lib/sounds.ts — Web Audio API con cola de sonidos
- lib/recap.ts — getDaySummary()
- lib/streaks.ts — lógica de rachas
- lib/achievements.ts — checkAutoAchievements()
- app/dashboard/actions.ts — Server Action principal del dashboard
- app/missions/actions.ts — Server Action de misiones y custom missions
- app/social/actions.ts — Server Actions del sistema social y ligas
- app/profile/actions.ts — changeActivePack(), updateAvatarConfig(), updatePublicProfileSettings()
- app/avatar/actions.ts — updateAvatarConfig()
- app/onboarding/actions.ts — completeOnboarding()

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
- No crear middleware.ts — la autenticación va en proxy.ts
- No añadir archivos individuales al commit — siempre git add .

## Lo que DEBES hacer
- Escribirme siempre en español
- Usar var(--color-*) para todos los colores de UI
- Añadir listener de ESC en todos los overlays y drawers
- Llamar a checkAutoAchievements() después de completar cualquier misión
- Insertar eventos en social_feed al completar misiones, subir de nivel o alcanzar hitos de racha
- Mostrar AvatarConfirmModal antes de completar logros manual/external
- Seguir el patrón de Server Components + Server Actions — sin API REST
- Respetar el límite de 20 amigos en todas las operaciones de friendships
- Filtrar misiones daily por active_pack en todas las queries que las usen
- Siempre git add . — nunca añadir archivos individuales
- Build y deploy primero, testing después en los prompts
- Verificar que npx tsc --noEmit pasa antes del build