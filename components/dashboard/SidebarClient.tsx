'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Icons ──────────────────────────────────────────────────────────────────
function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5L12 3L21 9.5V21H15V15H9V21H3V9.5Z" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r={active ? 4 : 3.5} />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      aria-label={`${count} solicitudes de amistad pendientes`}
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: 'var(--color-accent)',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Inicio',   icon: (a: boolean) => <IconHome active={a} />   },
  { href: '/missions',    label: 'Misiones', icon: (_: boolean) => <IconTarget />             },
  { href: '/achievements',label: 'Logros',   icon: (_: boolean) => <IconTrophy />             },
  { href: '/social',      label: 'Social',   icon: (_: boolean) => <IconUsers />              },
  { href: '/profile',     label: 'Perfil',   icon: (a: boolean) => <IconUser active={a} />   },
] as const

export default function SidebarClient({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 z-30 flex-col items-center py-5 gap-8"
      style={{
        background: 'var(--color-background)',
        borderRight: '1px solid var(--color-border)',
      }}
      aria-label="Sidebar de navegación"
    >
      {/* Logo mark */}
      <div className="w-9 h-9 rounded-card bg-accent/10 border border-accent/25 flex items-center justify-center flex-shrink-0">
        <IconStar />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href
          const isSocial = href === '/social'
          return (
            <div key={href} className="group relative flex items-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={`
                  w-11 h-11 rounded-component flex items-center justify-center
                  transition-colors duration-150 cursor-pointer
                  ${active
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-secondary'
                  }
                `}
              >
                <span className="relative inline-flex">
                  {icon(active)}
                  {isSocial && <PendingBadge count={pendingCount} />}
                </span>
              </Link>

              {/* Tooltip */}
              <span
                className="
                  absolute left-full ml-3 top-1/2 -translate-y-1/2
                  bg-surface-elevated text-text-primary text-xs font-medium
                  px-2.5 py-1.5 rounded-component whitespace-nowrap
                  border border-border
                  opacity-0 pointer-events-none
                  group-hover:opacity-100
                  transition-opacity duration-150
                  shadow-[0_4px_12px_rgba(0,0,0,0.4)]
                  z-50
                "
                role="tooltip"
              >
                {label}
              </span>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
