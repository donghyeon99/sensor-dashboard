// Design Ref: §3.2, §3.3 D5 — EEG raw ingest with sq split (Ch1/Ch2)
import type { DataPoint, EegAnalysis, EegRawSample } from '../../types/sensor'
import { createEegChannelFilter, processEegSample } from '../dsp/eegPipeline'
import { EEG_BUFFER_SIZE, type EegBufferState } from './types'

export const createEegBufferState = (): EegBufferState => ({
  fp1: [],
  fp2: [],
  sqCh1: [],
  sqCh2: [],
  sampleIndex: 0,
  fp1Filter: createEegChannelFilter(),
  fp2Filter: createEegChannelFilter(),
  rawLeadOff: { ch1: false, ch2: false },
})

export function ingestEegRaw(prev: EegBufferState, samples: EegRawSample[]): EegBufferState {
  if (samples.length === 0) return prev
  const fp1Filter = { ...prev.fp1Filter }
  const fp2Filter = { ...prev.fp2Filter }
  const newFp1: DataPoint[] = []
  const newFp2: DataPoint[] = []
  const newSqCh1: DataPoint[] = []
  const newSqCh2: DataPoint[] = []
  let idx = prev.sampleIndex
  for (const s of samples) {
    const v1 = processEegSample(fp1Filter, s.fp1)
    const v2 = processEegSample(fp2Filter, s.fp2)
    newFp1.push({ index: idx, value: v1 })
    newFp2.push({ index: idx, value: v2 })
    // SSE signalQuality is single-valued per sample; mirror to both channel buffers
    const sqValue = Math.max(0, 100 - (s.signalQuality ?? 0))
    newSqCh1.push({ index: idx, value: sqValue })
    newSqCh2.push({ index: idx, value: sqValue })
    idx++
  }
  const last = samples[samples.length - 1]
  return {
    fp1: [...prev.fp1, ...newFp1].slice(-EEG_BUFFER_SIZE),
    fp2: [...prev.fp2, ...newFp2].slice(-EEG_BUFFER_SIZE),
    sqCh1: [...prev.sqCh1, ...newSqCh1].slice(-EEG_BUFFER_SIZE),
    sqCh2: [...prev.sqCh2, ...newSqCh2].slice(-EEG_BUFFER_SIZE),
    sampleIndex: idx,
    fp1Filter,
    fp2Filter,
    rawLeadOff: {
      ch1: Boolean(last.leadOff?.ch1),
      ch2: Boolean(last.leadOff?.ch2),
    },
  }
}

export function normalizeEegAnalysis(raw: Record<string, unknown>): EegAnalysis {
  const num = (k: string, fallback = 0): number => {
    const v = raw[k]
    return typeof v === 'number' ? v : fallback
  }
  const opt = (k: string): number | undefined => {
    const v = raw[k]
    return typeof v === 'number' ? v : undefined
  }
  const bool = (k: string): boolean | undefined => {
    const v = raw[k]
    return typeof v === 'boolean' ? v : undefined
  }
  return {
    attention: num('attention'),
    focusIndex: num('focusIndex'),
    relaxationIndex: num('relaxationIndex'),
    stressIndex: num('stressIndex'),
    cognitiveLoad: num('cognitiveLoad'),
    emotionalBalance: num('emotionalBalance'),
    emotionalStability: num('emotionalStability'),
    hemisphericBalance: num('hemisphericBalance'),
    attentionLevel: opt('attentionLevel'),
    meditationLevel: num('meditationLevel'),
    totalPower: num('totalPower'),
    signalQuality: opt('signalQuality'),
    ch1LeadOff: bool('ch1LeadOff'),
    ch2LeadOff: bool('ch2LeadOff'),
  }
}
