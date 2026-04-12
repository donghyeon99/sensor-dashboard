// Design Ref: §3.5 — primitive card container
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated'
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const base =
    variant === 'elevated'
      ? 'bg-bg-elevated border border-border rounded-xl p-4'
      : 'bg-bg-card border border-border rounded-2xl p-6'
  return <div className={`${base} ${className}`}>{children}</div>
}
