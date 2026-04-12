// Design Ref: §3.5 D7 — 3-variant LeadOff banner (FP1 only / FP2 only / both)
import { TriangleAlert } from 'lucide-react'
import { useEegStore } from '../../stores/slices/eegStore'

type LeadOffContext = 'filter' | 'sqi' | 'spectrum' | 'band' | 'index' | 'ppg-filter' | 'ppg-sqi' | 'ppg-hrv' | 'acc'

interface Props {
  /** Restrict which channel's state to show. Defaults to showing both. */
  only?: 'ch1' | 'ch2'
  context?: LeadOffContext
  size?: 'sm' | 'md'
  className?: string
}

const CONTEXT_LABEL: Record<LeadOffContext, string> = {
  filter: 'signal quality',
  sqi: 'signal quality',
  spectrum: 'power spectrum',
  band: 'frequency band',
  index: 'EEG index',
  'ppg-filter': 'PPG signal quality',
  'ppg-sqi': 'PPG signal quality',
  'ppg-hrv': 'PPG',
  acc: 'ACC signal quality',
}

export function LeadOffBanner({ only, context = 'filter', size = 'sm', className }: Props) {
  const rawLeadOff = useEegStore((s) => s.rawLeadOff)
  const eegAnalysis = useEegStore((s) => s.analysis)

  const ch1Off = rawLeadOff.ch1 || eegAnalysis?.ch1LeadOff === true
  const ch2Off = rawLeadOff.ch2 || eegAnalysis?.ch2LeadOff === true

  const effectiveCh1 = only === 'ch2' ? false : ch1Off
  const effectiveCh2 = only === 'ch1' ? false : ch2Off

  if (!effectiveCh1 && !effectiveCh2) return null

  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  const padding = size === 'md' ? 'p-3' : 'p-2'
  const base = `${padding} bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 ${className ?? ''}`

  const isCh1Only = (only === 'ch1' && effectiveCh1) || (!only && effectiveCh1 && !effectiveCh2)
  const isCh2Only = (only === 'ch2' && effectiveCh2) || (!only && !effectiveCh1 && effectiveCh2)

  if (isCh1Only) {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <span className="text-red-300 text-sm">
          FP1 electrode contact issue — signal quality may be degraded
        </span>
      </div>
    )
  }
  if (isCh2Only) {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <span className="text-red-300 text-sm">
          FP2 electrode contact issue — signal quality may be degraded
        </span>
      </div>
    )
  }

  // Both channels off
  const ctxLabel = CONTEXT_LABEL[context]
  if (size === 'md') {
    return (
      <div className={base}>
        <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
        <div className="text-red-300">
          <div className="font-medium text-sm">Electrode contact issue detected</div>
          <div className="text-xs">
            FP1: off, FP2: off — {ctxLabel} accuracy may be degraded
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={base}>
      <TriangleAlert className={`${iconSize} text-red-400 shrink-0`} aria-hidden="true" />
      <span className="text-red-300 text-sm">
        Electrode contact issue (FP1: OFF, FP2: OFF) — {ctxLabel} may be degraded
      </span>
    </div>
  )
}
