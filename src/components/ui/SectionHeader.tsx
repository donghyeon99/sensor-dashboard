// Design Ref: §3.5 — title + subtitle pattern used by every visualizer section
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  dotColor?: string
  right?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  dotColor,
  right,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {dotColor && <div className={`w-3 h-3 rounded-full ${dotColor}`} />}
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        </div>
        {right}
      </div>
      {subtitle && (
        <p className={`text-xs text-text-muted mt-1 ${dotColor ? 'ml-5' : ''}`}>{subtitle}</p>
      )}
    </div>
  )
}
