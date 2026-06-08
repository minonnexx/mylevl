'use client'

import { useState, useTransition } from 'react'
import { Dumbbell, BookOpen, Shield, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { PACK_LIST, PACK_META } from '@/lib/constants/packs'
import { changeActivePack } from '@/app/profile/actions'
import type { PackId } from '@/types/supabase'

const PACK_ICONS: Record<PackId, React.ElementType> = {
  guerrero: Dumbbell,
  sabio: BookOpen,
  monje: Shield,
  heroe: Star,
}

export function PackSelector({ currentPack }: { currentPack: PackId | null }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PackId | null>(currentPack)
  const [isPending, startTransition] = useTransition()

  const current = selected ? PACK_META[selected] : null
  const CurrentIcon = selected ? PACK_ICONS[selected] : null

  const handleConfirm = (pack: PackId) => {
    if (pack === currentPack) {
      setOpen(false)
      return
    }
    setSelected(pack)
    startTransition(async () => {
      const result = await changeActivePack(pack)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Pack cambiado a ${PACK_META[pack].label}`)
        setOpen(false)
      }
    })
  }

  return (
    <section aria-labelledby="section-pack">
      <div className="border-b border-border/40 pb-2 mb-4">
        <h2
          id="section-pack"
          className="text-[11px] font-medium text-text-muted uppercase tracking-wider"
        >
          Tu pack actual
        </h2>
      </div>

      <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
        {/* Current pack display */}
        <div className="flex items-center gap-4 p-6">
          {CurrentIcon && current ? (
            <>
              <div
                className="w-10 h-10 rounded-component flex items-center justify-center flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)' }}
              >
                <CurrentIcon size={20} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{current.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{current.subtitle}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted flex-1">Sin pack seleccionado</p>
          )}

          <button
            onClick={() => setOpen(o => !o)}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            Cambiar pack
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Pack selection */}
        {open && (
          <div className="border-t border-border/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-border/40 sm:divide-y-0">
              {PACK_LIST.map((pack, idx) => {
                const Icon = PACK_ICONS[pack.id]
                const isActive = selected === pack.id
                const isLast = idx === PACK_LIST.length - 1

                return (
                  <button
                    key={pack.id}
                    onClick={() => handleConfirm(pack.id)}
                    disabled={isPending}
                    className={`flex items-center gap-3 px-6 py-4 text-left transition-colors duration-100 w-full
                      ${!isLast ? 'sm:border-b sm:border-border/40' : ''}
                      ${isActive ? '' : 'hover:bg-surface-elevated'}
                    `}
                    style={isActive ? {
                      background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                    } : {}}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', flexShrink: 0 }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                      >
                        {pack.label}
                      </span>
                      <span className="text-xs text-text-muted">{pack.subtitle}</span>
                    </div>
                    {isActive && (
                      <svg viewBox="0 0 24 24" fill="none" className="ml-auto w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
