'use client'

import { resetProfileAction } from '@/app/profile/actions'

export function ResetProfileButton() {
  function handleSubmit() {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('recap-shown-'))
      .forEach(key => sessionStorage.removeItem(key))
  }

  return (
    <form action={resetProfileAction} onSubmit={handleSubmit}>
      <button
        type="submit"
        className="text-xs text-text-muted px-3 py-1.5 rounded-component border border-error/30 opacity-40 hover:opacity-100 transition-opacity"
      >
        Reset de perfil (dev)
      </button>
    </form>
  )
}
