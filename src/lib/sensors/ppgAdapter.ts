// Design Ref: §3.2, §3.3 — PPG raw ingest with 0.5-5Hz bandpass filter
import type { DataPoint, PpgAnalysis, PpgRawSample } from '../../types/sensor'
import { createPpgChannelFilter, processPpgSample } from '../dsp/ppgPipeline'
import { HISTORY_SIZE, PPG_BUFFER_SIZE, type PpgBufferState } from './types'

export const createPpgBufferState = (): PpgBufferState => ({
  ir: [],
  red: [],
  irFiltered: [],
  redFiltered: [],
  irFilter: createPpgChannelFilter(),
  redFilter: createPpgChannelFilter(),
  sampleIndex: 0,
  bpmHistory: [],
  spo2History: [],
  historyIndex: 0,
})

export function ingestPpgRaw(prev: PpgBufferState, samples: PpgRawSample[]): PpgBufferState {
  if (samples.length === 0) return prev
  const irFilter = { ...prev.irFilter }
  const redFilter = { ...prev.redFilter }
  const newIr: DataPoint[] = []
  const newRed: DataPoint[] = []
  const newIrFiltered: DataPoint[] = []
  const newRedFiltered: DataPoint[] = []
  let idx = prev.sampleIndex
  for (const s of samples) {
    newIr.push({ index: idx, value: s.ir })
    newRed.push({ index: idx, value: s.red })
    newIrFiltered.push({ index: idx, value: processPpgSample(irFilter, s.ir) })
    newRedFiltered.push({ index: idx, value: processPpgSample(redFilter, s.red) })
    idx++
  }
  return {
    ...prev,
    ir: [...prev.ir, ...newIr].slice(-PPG_BUFFER_SIZE),
    red: [...prev.red, ...newRed].slice(-PPG_BUFFER_SIZE),
    irFiltered: [...prev.irFiltered, ...newIrFiltered].slice(-PPG_BUFFER_SIZE),
    redFiltered: [...prev.redFiltered, ...newRedFiltered].slice(-PPG_BUFFER_SIZE),
    irFilter,
    redFilter,
    sampleIndex: idx,
  }
}

export function ingestPpgHistoryFromAnalysis(
  prev: PpgBufferState,
  analysis: PpgAnalysis,
): PpgBufferState {
  const nextIdx = prev.historyIndex + 1
  const next: PpgBufferState = { ...prev, historyIndex: nextIdx }
  if (analysis.bpm > 0) {
    next.bpmHistory = [...prev.bpmHistory, { index: nextIdx, value: analysis.bpm }].slice(
      -HISTORY_SIZE,
    )
  }
  if (analysis.spo2 != null) {
    next.spo2History = [...prev.spo2History, { index: nextIdx, value: analysis.spo2 }].slice(
      -HISTORY_SIZE,
    )
  }
  return next
}

export function normalizePpgAnalysis(raw: Record<string, unknown>): PpgAnalysis {
  const num = (k: string, fallback = 0): number => {
    const v = raw[k]
    return typeof v === 'number' ? v : fallback
  }
  const opt = (k: string): number | undefined => {
    const v = raw[k]
    return typeof v === 'number' ? v : undefined
  }
  const either = (k1: string, k2: string): number | undefined => {
    const a = raw[k1]
    if (typeof a === 'number') return a
    const b = raw[k2]
    return typeof b === 'number' ? b : undefined
  }
  return {
    bpm: num('bpm'),
    spo2: typeof raw.spo2 === 'number' ? raw.spo2 : null,
    sdnn: opt('sdnn'),
    rmssd: opt('rmssd'),
    pnn50: opt('pnn50'),
    pnn20: opt('pnn20'),
    sdsd: opt('sdsd'),
    avnn: opt('avnn'),
    hrMax: opt('hrMax'),
    hrMin: opt('hrMin'),
    lfPower: either('lfPower', 'lf_power'),
    hfPower: either('hfPower', 'hf_power'),
    lfHfRatio: either('lfHfRatio', 'lf_hf_ratio'),
    stressIndex: opt('stressIndex'),
  }
}
