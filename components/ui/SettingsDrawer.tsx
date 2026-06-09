'use client'

import { useState, useTransition, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Pencil, RefreshCw, LogOut, Globe, Lock, Dumbbell, BookOpen, Shield, Star } from 'lucide-react'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { changeUsername, changeActivePack } from '@/app/profile/actions'
import { toggleFeedPublic } from '@/app/social/actions'
import { PACK_LIST, PACK_META } from '@/lib/constants/packs'
import type { PackId } from '@/types/supabase'

const PACK_ICONS: Record<PackId, React.ElementType> = {
  guerrero: Dumbbell,
  sabio: BookOpen,
  monje: Shield,
  heroe: Star,
}

export interface SettingsProfile {
  username: string | null
  username_changed_at: string | null
  active_pack: PackId | null
  feed_public: boolean
  avatar_config: AvatarConfig | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  profile: SettingsProfile
}

export function SettingsDrawer({ isOpen, onClose, profile }: Props) {
  const router = useRouter()

  // ── Username ────────────────────────────────────────────────────────────────
  const [localUsername, setLocalUsername] = useState(profile.username)
  const [editing, setEditing] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isSaving, startSave] = useTransition()

  // ── Pack ────────────────────────────────────────────────────────────────────
  const [localPack, setLocalPack] = useState<PackId | null>(profile.active_pack)
  const [showPacks, setShowPacks] = useState(false)
  const [isPackPending, startPack] = useTransition()

  // ── Feed ────────────────────────────────────────────────────────────────────
  const [isPublic, setIsPublic] = useState(profile.feed_public)
  const [isFeedPending, startFeed] = useTransition()

  // Sync when props change (after router.refresh)
  useEffect(() => { setLocalUsername(profile.username) }, [profile.username])
  useEffect(() => { setLocalPack(profile.active_pack) }, [profile.active_pack])
  useEffect(() => { setIsPublic(profile.feed_public) }, [profile.feed_public])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setEditing(false)
      setShowPacks(false)
      setUsernameError('')
    }
  }, [isOpen])

  // ── Cooldown ─────────────────────────────────────────────────────────────────
  const availableAt = profile.username_changed_at
    ? new Date(new Date(profile.username_changed_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null
  const canEdit = !availableAt || new Date() >= availableAt

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleStartEdit() {
    setUsernameInput(localUsername ?? '')
    setUsernameError('')
    setEditing(true)
  }

  function handleSaveUsername() {
    setUsernameError('')
    startSave(async () => {
      const result = await changeUsername(usernameInput)
      if (result?.error) {
        setUsernameError(result.error)
      } else {
        const saved = usernameInput.trim().toLowerCase()
        setLocalUsername(saved)
        setEditing(false)
        toast.success('Nombre de usuario actualizado')
        router.refresh()
      }
    })
  }

  function handlePackChange(pack: PackId) {
    if (pack === localPack) { setShowPacks(false); return }
    startPack(async () => {
      const result = await changeActivePack(pack)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setLocalPack(pack)
        setShowPacks(false)
        toast.success(`Pack cambiado a ${PACK_META[pack].label}`)
        router.refresh()
      }
    })
  }

  function handleFeedToggle() {
    startFeed(async () => {
      const newValue = await toggleFeedPublic()
      if (newValue !== null) setIsPublic(newValue)
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const currentPackMeta = localPack ? PACK_META[localPack] : null
  const CurrentPackIcon = localPack ? PACK_ICONS[localPack] : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.55)' }}
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Ajustes"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 w-full md:w-[320px] flex flex-col overflow-hidden"
            style={{ background: 'var(--color-surface)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 h-14 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="text-sm font-semibold text-text-primary">Ajustes</span>
              <button
                onClick={onClose}
                aria-label="Cerrar ajustes"
                className="flex items-center justify-center w-8 h-8 rounded-component transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Perfil ─────────────────────────────────────────────────── */}
              <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4">Perfil</p>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 mb-5">
                  <AvatarDisplay config={profile.avatar_config} pack={profile.active_pack} size={64} />
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-xs rounded-component px-3 py-1.5 transition-opacity opacity-40 cursor-not-allowed"
                    style={{
                      color: 'var(--color-text-muted)',
                      border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
                    }}
                  >
                    <Pencil size={11} aria-hidden />
                    Editar personaje
                  </button>
                </div>

                <p className="text-xs text-text-muted mb-1">Nombre de usuario</p>

                {editing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !isSaving && handleSaveUsername()}
                      autoFocus
                      maxLength={20}
                      className="w-full px-3 py-2 text-sm rounded-component border outline-none transition-colors"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: usernameError ? 'var(--color-error, #e53e3e)' : 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      placeholder="Nombre de usuario"
                    />
                    {usernameError && (
                      <p className="text-xs" style={{ color: 'var(--color-error, #e53e3e)' }}>{usernameError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUsername}
                        disabled={isSaving || !usernameInput.trim()}
                        className="flex-1 text-xs font-semibold py-2 rounded-component transition-opacity disabled:opacity-40"
                        style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
                      >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        disabled={isSaving}
                        className="text-xs py-2 px-3 rounded-component transition-colors hover:bg-surface-elevated disabled:opacity-40"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {localUsername ?? '—'}
                    </span>
                    {canEdit ? (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity"
                      >
                        <Pencil size={12} aria-hidden />
                        Editar
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Disponible el {availableAt?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Misiones ───────────────────────────────────────────────── */}
              <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4">Misiones</p>

                <p className="text-xs text-text-muted mb-1">Pack activo</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {CurrentPackIcon && (
                      <CurrentPackIcon size={15} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} aria-hidden />
                    )}
                    <span className="text-sm font-medium text-text-primary">
                      {currentPackMeta?.label ?? 'Sin pack'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPacks(p => !p)}
                    disabled={isPackPending}
                    className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    <RefreshCw size={12} aria-hidden />
                    Cambiar pack
                  </button>
                </div>

                {showPacks && (
                  <div
                    className="mt-3 rounded-component overflow-hidden"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    {PACK_LIST.map((pack, idx) => {
                      const Icon = PACK_ICONS[pack.id]
                      const isActive = localPack === pack.id
                      return (
                        <button
                          key={pack.id}
                          onClick={() => handlePackChange(pack.id)}
                          disabled={isPackPending}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors disabled:opacity-50${!isActive ? ' hover:bg-surface-elevated' : ''}`}
                          style={{
                            borderBottom: idx < PACK_LIST.length - 1 ? '1px solid var(--color-border)' : undefined,
                            background: isActive ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : undefined,
                          }}
                        >
                          <Icon
                            size={15}
                            strokeWidth={1.5}
                            style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', flexShrink: 0 }}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-sm font-medium block"
                              style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                            >
                              {pack.label}
                            </span>
                            <span className="text-xs text-text-muted">{pack.subtitle}</span>
                          </div>
                          {isActive && (
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Privacidad ─────────────────────────────────────────────── */}
              <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4">Privacidad</p>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {isPublic
                        ? <Globe size={15} style={{ color: 'var(--color-accent)' }} aria-hidden />
                        : <Lock size={15} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Feed público</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {isPublic
                          ? 'Tus amigos pueden ver tu actividad'
                          : 'Tu actividad es privada'
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleFeedToggle}
                    disabled={isFeedPending}
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Activar o desactivar feed público"
                    className="relative flex-shrink-0 w-11 h-6 rounded-pill overflow-hidden transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: isPublic
                        ? 'color-mix(in srgb, var(--color-accent) 80%, transparent)'
                        : 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
                      border: isPublic
                        ? '1px solid color-mix(in srgb, var(--color-accent) 60%, transparent)'
                        : '1px solid color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
                    }}
                  >
                    <span
                      className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full transition-transform duration-200"
                      style={{
                        background: 'var(--color-text-primary)',
                        transform: isPublic ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* ── Cuenta ─────────────────────────────────────────────────── */}
              <div className="px-6 py-5">
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4">Cuenta</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm transition-opacity opacity-70 hover:opacity-100"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <LogOut size={15} aria-hidden />
                  Cerrar sesión
                </button>
              </div>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
