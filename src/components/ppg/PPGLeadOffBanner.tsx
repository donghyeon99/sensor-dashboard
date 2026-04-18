// PPG-specific lead-off banner. Reads from PPG store (red/IR channel contact),
// not EEG store. Previously this just wrapped the EEG LeadOffBanner, which
// caused the PPG section to show EEG electrode state ("FP1 off" in PPG panel).
import { TriangleAlert } from 'lucide-react'
import { usePpgStore } from '../../stores/slices/ppgStore'

interface Props {
  context?: 'ppg-filter' | 'ppg-sqi' | 'ppg-hrv'
  size?: 'sm' | 'md'
  className?: string
}

const CONTEXT_LABEL: Record<NonNullable<Props['context']>, string> = {
  'ppg-filter': 'PPG signal quality',
  'ppg-sqi': 'PPG signal quality',
  'ppg-hrv': 'PPG / HRV',
}

export function PPGLeadOffBanner({ context = 'ppg-filter', size = 'sm', className }: Props) {
  const rawLeadOff = usePpgStore((s) => s.rawLeadOff)
  const ch1Off = rawLeadOff.ch1
  const ch2Off = rawLeadOff.ch2

  if (!ch1Off && !ch2Off) return null

  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  const padding = size === 'md' ? 'p-3' : 'p-2'
  const base = `${padding} bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 ${className ?? ''}`
  const ctxLabel = CONTEXT_LABEL[context]

  if (ch1Off && !ch2Off) {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <span className="text-red-300 text-sm">
          PPG Red channel contact issue — {ctxLabel} may be degraded
        </span>
      </div>
    )
  }
  if (ch2Off && !ch1Off) {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <span className="text-red-300 text-sm">
          PPG IR channel contact issue — {ctxLabel} may be degraded
        </span>
      </div>
    )
  }

  if (size === 'md') {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <div className="text-red-300">
          <div className="font-medium text-sm">PPG sensor contact issue detected</div>
          <div className="text-xs">Red: off, IR: off — {ctxLabel} accuracy may be degraded</div>
        </div>
      </div>
    )
  }
  return (
    <div className={base}>
      <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
      <span className="text-red-300 text-sm">
        PPG sensor contact issue (Red: OFF, IR: OFF) — {ctxLabel} may be degraded
      </span>
    </div>
  )
}
