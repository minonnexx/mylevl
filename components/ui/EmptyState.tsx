'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon
        size={40}
        strokeWidth={1.5}
        className="text-text-muted opacity-40 mb-1"
        aria-hidden
      />
      <p className="text-[15px] font-medium text-text-primary">{title}</p>
      {description && (
        <p className="text-[13px] text-text-muted">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-3 px-4 py-1.5 rounded-component text-sm border border-border/60 text-text-muted hover:text-text-primary transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-3 px-4 py-1.5 rounded-component text-sm border border-border/60 text-text-muted hover:text-text-primary transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
