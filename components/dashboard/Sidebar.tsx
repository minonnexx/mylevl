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

function IconUser({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r={active ? 4 : 3.5} />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio',   icon: (a: boolean) => <IconHome active={a} />   },
  { href: '/missions',  label: 'Misiones', icon: (_: boolean) => <IconTarget />             },
  { href: '/profile',   label: 'Perfil',   icon: (a: boolean) => <IconUser active={a} />   },
] as const

export default function Sidebar() {
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
                {icon(active)}
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
