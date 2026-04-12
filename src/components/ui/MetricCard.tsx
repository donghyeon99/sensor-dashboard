// Design Ref: §3.5 D5 — threshold-aware metric tile shared by EEG/PPG/ACC card grids
import type { ReactNode } from 'react'
import {
  classifyIndex,
  getThresholdTextClass,
  type IndexThreshold,
} from '../../lib/thresholds/indexThresholds'
import { IndexTooltip } from '../eeg/IndexTooltip'

export interface MetricCardProps {
  threshold: IndexThreshold
  value: number | null | undefined
  decimals?: number
  dotColor: string
  emoji?: string
  emojiAnimation?: string
  basis?: string
  /** Render big emphasized number (EEG index style) vs compact metric (PPG/ACC tile) */
  size?: 'compact' | 'large'
  /** Minimum positive value required for BPM-style metrics */
  requirePositive?: boolean
  /** Extra description line below label */
  description?: ReactNode
}

const isValid = (v: number | null | undefined): v is number =>
  v !== undefined && v !== null && !Number.isNaN(v)

export function MetricCard({
  threshold,
  value,
  decimals = 1,
  dotColor,
  emoji,
  emojiAnimation,
  basis,
  size = 'compact',
  requirePositive = false,
  description,
}: MetricCardProps) {
  const valid = isValid(value) && (!requirePositive || (value as number) > 0)
  const level = valid ? classifyIndex(value as number, threshold) : null
  const colorClass = level ? getThresholdTextClass(level.color) : 'text-text-muted'
  const display = valid ? (value as number).toFixed(decimals) : size === 'large' ? '--' : '—'

  if (size === 'large') {
    return (
      <div className="group relative bg-bg-elevated border border-border rounded-xl p-4 hover:bg-bg-hover transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <span className="text-sm font-semibold text-text-primary">
              {threshold.displayName}
            </span>
          </div>
          {basis && (
            <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 bg-bg-base rounded">
              {basis}
            </span>
          )}
        </div>
        <div className="text-3xl font-extrabold text-text-primary mb-1 font-mono tracking-tight">
          {display}
          {threshold.unit && (
            <span className="text-sm text-text-muted ml-1 font-normal">{threshold.unit}</span>
          )}
        </div>
        <div className={`text-xs font-semibold mb-2 ${colorClass}`}>
          {level ? level.label : 'No data'}
        </div>
        {(description ?? threshold.description) && (
          <div className="text-[11px] text-text-muted leading-relaxed">
            {description ?? threshold.description}
          </div>
        )}
        <IndexTooltip threshold={threshold} />
      </div>
    )
  }

  return (
    <div className="group relative bg-bg-base rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold text-text-secondary">{threshold.displayName}</span>
      </div>
      <div className="text-xl font-bold text-text-primary font-mono flex items-baseline gap-1">
        {emoji && (
          <span
            className="text-base inline-block origin-center"
            style={{ animation: emojiAnimation }}
          >
            {emoji}
          </span>
        )}
        <span>{display}</span>
        {threshold.unit && (
          <span className="text-[10px] text-text-muted font-normal">{threshold.unit}</span>
        )}
      </div>
      <div className={`text-[11px] font-medium mt-1 ${colorClass}`}>
        {level ? level.label : '—'}
      </div>
      <IndexTooltip threshold={threshold} />
    </div>
  )
}
