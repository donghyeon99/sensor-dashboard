// Design Ref: §3.3 D5 — EEG domain slice with sqCh1/sqCh2
import { create } from 'zustand'
import type { EegAnalysis, EegRawSample } from '../../types/sensor'
import {
  createEegBufferState,
  ingestEegRaw,
  normalizeEegAnalysis,
} from '../../lib/sensors/eegAdapter'
import type { EegBufferState } from '../../lib/sensors/types'

interface EegState extends EegBufferState {
  analysis: EegAnalysis | null
  ingestRaw: (samples: EegRawSample[]) => void
  ingestAnalysis: (raw: Record<string, unknown>) => void
  reset: () => void
}

export const useEegStore = create<EegState>((set) => ({
  ...createEegBufferState(),
  analysis: null,
  ingestRaw: (samples) =>
    set((state) => {
      const next = ingestEegRaw(state, samples)
      return {
        fp1: next.fp1,
        fp2: next.fp2,
        sqCh1: next.sqCh1,
        sqCh2: next.sqCh2,
        sampleIndex: next.sampleIndex,
        fp1Filter: next.fp1Filter,
        fp2Filter: next.fp2Filter,
        rawLeadOff: next.rawLeadOff,
      }
    }),
  ingestAnalysis: (raw) => set({ analysis: normalizeEegAnalysis(raw) }),
  reset: () =>
    set({
      ...createEegBufferState(),
      analysis: null,
    }),
}))
