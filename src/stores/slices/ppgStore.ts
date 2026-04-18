// Design Ref: §3.3 — PPG domain slice with filtered buffers
import { create } from 'zustand'
import type { PpgAnalysis, PpgRawSample } from '../../types/sensor'
import {
  createPpgBufferState,
  ingestPpgHistoryFromAnalysis,
  ingestPpgRaw,
  normalizePpgAnalysis,
} from '../../lib/sensors/ppgAdapter'
import type { PpgBufferState } from '../../lib/sensors/types'

interface PpgState extends PpgBufferState {
  analysis: PpgAnalysis | null
  ingestRaw: (samples: PpgRawSample[]) => void
  ingestAnalysis: (raw: Record<string, unknown>) => void
  reset: () => void
}

export const usePpgStore = create<PpgState>((set) => ({
  ...createPpgBufferState(),
  analysis: null,
  ingestRaw: (samples) =>
    set((state) => {
      const next = ingestPpgRaw(state, samples)
      return {
        ir: next.ir,
        red: next.red,
        irFiltered: next.irFiltered,
        redFiltered: next.redFiltered,
        irFilter: next.irFilter,
        redFilter: next.redFilter,
        sqi: next.sqi,
        sampleIndex: next.sampleIndex,
      }
    }),
  ingestAnalysis: (raw) =>
    set((state) => {
      const analysis = normalizePpgAnalysis(raw)
      const next = ingestPpgHistoryFromAnalysis(state, analysis)
      return {
        analysis,
        bpmHistory: next.bpmHistory,
        spo2History: next.spo2History,
        historyIndex: next.historyIndex,
      }
    }),
  reset: () =>
    set({
      ...createPpgBufferState(),
      analysis: null,
    }),
}))
