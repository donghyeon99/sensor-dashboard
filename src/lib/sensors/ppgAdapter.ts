// Design Ref: §3.2, §3.3 — PPG raw ingest with 0.5-5Hz bandpass filter + amplitude-based SQI
import type { DataPoint, PpgAnalysis, PpgRawSample } from '../../types/sensor'
import { calculatePpgSqi, createPpgChannelFilter, processPpgSample } from '../dsp/ppgPipeline'
import { HISTORY_SIZE, PPG_BUFFER_SIZE, type PpgBufferState } from './types'

export const createPpgBufferState = (): PpgBufferState => ({
  ir: [],
  red: [],
  irFiltered: [],
  redFiltered: [],
  irFilter: createPpgChannelFilter(),
  redFilter: createPpgChannelFilter(),
  sampleIndex: 0,
  sqi: { redSQI: [], irSQI: [], overallSQI: [] },
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
  const newIrFilteredPts: DataPoint[] = []
  const newRedFilteredPts: DataPoint[] = []
  const newIrFilteredVals: number[] = []
  const newRedFilteredVals: number[] = []
  let idx = prev.sampleIndex
  for (const s of samples) {
    newIr.push({ index: idx, value: s.ir })
    newRed.push({ index: idx, value: s.red })
    const irVal = processPpgSample(irFilter, s.ir)
    const redVal = processPpgSample(redFilter, s.red)
    newIrFilteredPts.push({ index: idx, value: irVal })
    newRedFilteredPts.push({ index: idx, value: redVal })
    newIrFilteredVals.push(irVal)
    newRedFilteredVals.push(redVal)
    idx++
  }

  // Amplitude-based SQI (matches sdk.linkband.store)
  const allIrFiltered = [...prev.irFiltered.map((p) => p.value), ...newIrFilteredVals]
  const allRedFiltered = [...prev.redFiltered.map((p) => p.value), ...newRedFilteredVals]
  const irSqiVals = calculatePpgSqi(allIrFiltered)
  const redSqiVals = calculatePpgSqi(allRedFiltered)

  // Build SQI DataPoint arrays for the new samples only
  const offset = prev.irFiltered.length
  const startIdx = prev.sampleIndex
  const newRedSQI: DataPoint[] = []
  const newIrSQI: DataPoint[] = []
  const newOverallSQI: DataPoint[] = []
  for (let i = 0; i < samples.length; i++) {
    const j = offset + i
    const r = redSqiVals[j] ?? 0
    const ir = irSqiVals[j] ?? 0
    newRedSQI.push({ index: startIdx + i, value: r })
    newIrSQI.push({ index: startIdx + i, value: ir })
    newOverallSQI.push({ index: startIdx + i, value: (r + ir) / 2 })
  }

  return {
    ...prev,
    ir: [...prev.ir, ...newIr].slice(-PPG_BUFFER_SIZE),
    red: [...prev.red, ...newRed].slice(-PPG_BUFFER_SIZE),
    irFiltered: [...prev.irFiltered, ...newIrFilteredPts].slice(-PPG_BUFFER_SIZE),
    redFiltered: [...prev.redFiltered, ...newRedFilteredPts].slice(-PPG_BUFFER_SIZE),
    sqi: {
      redSQI: [...prev.sqi.redSQI, ...newRedSQI].slice(-PPG_BUFFER_SIZE),
      irSQI: [...prev.sqi.irSQI, ...newIrSQI].slice(-PPG_BUFFER_SIZE),
      overallSQI: [...prev.sqi.overallSQI, ...newOverallSQI].slice(-PPG_BUFFER_SIZE),
    },
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
