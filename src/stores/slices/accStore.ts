// Design Ref: §3.3 — ACC domain slice
import { create } from 'zustand'
import type { AccAnalysis, AccSample } from '../../types/sensor'
import {
  createAccBufferState,
  ingestAccRaw,
  normalizeAccAnalysis,
} from '../../lib/sensors/accAdapter'
import type { AccBufferState } from '../../lib/sensors/types'

interface AccState extends AccBufferState {
  analysis: AccAnalysis | null
  ingestRaw: (samples: AccSample[]) => void
  ingestAnalysis: (raw: Record<string, unknown>) => void
  reset: () => void
}

export const useAccStore = create<AccState>((set) => ({
  ...createAccBufferState(),
  analysis: null,
  ingestRaw: (samples) =>
    set((state) => {
      const next = ingestAccRaw(state, samples)
      return {
        x: next.x,
        y: next.y,
        z: next.z,
        magnitude: next.magnitude,
        sampleIndex: next.sampleIndex,
      }
    }),
  ingestAnalysis: (raw) => set({ analysis: normalizeAccAnalysis(raw) }),
  reset: () =>
    set({
      ...createAccBufferState(),
      analysis: null,
    }),
}))
