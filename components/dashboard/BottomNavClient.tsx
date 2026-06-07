'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9.5L12 3L21 9.5V21H15V15H9V21H3V9.5Z" />
    </svg>
  )
}

function IconTarget({ active }: { active: boolean }) {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" strokeOpacity={active ? 1 : 0} />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r={active ? 4 : 3.5} />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconUsers({ active: _active }: { active: boolean }) {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
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
        top: '-2px',
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
  { href: '/dashboard', label: 'Inicio',   Icon: IconHome   },
  { href: '/missions',  label: 'Misiones', Icon: IconTarget },
  { href: '/social',    label: 'Social',   Icon: IconUsers  },
  { href: '/profile',   label: 'Perfil',   Icon: IconUser   },
] as const

export default function BottomNavClient({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4 md:hidden"
      aria-label="Navegación principal"
    >
      <div
        className="flex rounded-card overflow-hidden"
        style={{
          background: 'rgba(26, 26, 29, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          const isSocial = href === '/social'
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px]
                transition-colors duration-150 relative
                ${active ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}
              `}
            >
              {/* Active pill indicator */}
              {active && (
                <span
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-pill bg-accent"
                  aria-hidden
                />
              )}
              <span className="relative inline-flex">
                <Icon active={active} />
                {isSocial && <PendingBadge count={pendingCount} />}
              </span>
              <span
                className={`text-[10px] font-medium leading-none transition-all duration-200 ${
                  active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
