// Design Ref: §3.5 — colored info pill used in visualizer introductions
type BadgeColor = 'teal' | 'coral' | 'yellow' | 'purple'

const colorClasses: Record<BadgeColor, string> = {
  teal: 'bg-teal/10 text-teal border-teal/20',
  coral: 'bg-coral/10 text-coral border-coral/20',
  yellow: 'bg-yellow/10 text-yellow border-yellow/20',
  purple: 'bg-purple/10 text-purple border-purple/20',
}

interface InfoBadgeProps {
  text: string
  color?: BadgeColor
}

export function InfoBadge({ text, color = 'teal' }: InfoBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono border ${colorClasses[color]}`}
    >
      {text}
    </span>
  )
}
