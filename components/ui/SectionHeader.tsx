interface SectionHeaderProps {
  title: string
  accentColor?: string
  right?: React.ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  id?: string
}

export function SectionHeader({
  title,
  accentColor = 'var(--color-accent)',
  right,
  as: Tag = 'h2',
  className,
  id,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-2 border-b border-border/40${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden
          className="h-[2px] w-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <Tag
          id={id}
          className="text-[11px] font-semibold text-text-muted uppercase tracking-widest"
        >
          {title}
        </Tag>
      </div>
      {right && (
        <div className="flex items-center">{right}</div>
      )}
    </div>
  )
}
