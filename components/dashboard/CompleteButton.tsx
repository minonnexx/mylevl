'use client'

import { useFormStatus } from 'react-dom'

export function CompleteButton({ label = 'Completar misión', disabled: externalDisabled }: { label?: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  const isDisabled = pending || (externalDisabled ?? false)

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={isDisabled}
      className="
        bg-accent text-white font-semibold px-4 py-2.5 rounded-component whitespace-nowrap
        inline-flex items-center justify-center gap-2
        border border-accent/40
        transition-all duration-150 ease-out
        hover:shadow-[0_0_16px_rgba(127,119,221,0.35)]
        active:scale-[0.96] active:shadow-[0_0_22px_rgba(127,119,221,0.50)]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
      "
    >
      {pending ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Completando…
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4"
            stroke="currentColor"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
