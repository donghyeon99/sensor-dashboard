// Design Ref: §3.2, §3.3 D5 — EEG raw ingest with amplitude-based SQI (Ch1/Ch2)
import type { DataPoint, EegAnalysis, EegRawSample } from '../../types/sensor'
import { createEegChannelFilter, processEegSample } from '../dsp/eegPipeline'
import { EEG_BUFFER_SIZE, type EegBufferState } from './types'
import { appendCap } from './bufferUtil'

// EEG SQI parameters mirror eegPipeline.ts
const EEG_SQI_WINDOW = 125
const EEG_AMP_THRESHOLD = 150

/**
 * Incremental EEG SQI: only recompute window positions whose right edge overlaps
 * the new tail. Old positions retain their final SQI (their window has slid past).
 */
function appendEegSqiIncremental(
  prevSqi: DataPoint[],
  filteredVals: number[],         // full filtered value buffer (capped)
  newCount: number,
  startIdxForFirstNew: number,
  cap: number,
): DataPoint[] {
  if (newCount === 0) return prevSqi
  const len = filteredVals.length
  // Guard: SQI windows need at least EEG_SQI_WINDOW samples. During cold start
  // (first ~125 samples), reading filteredVals[j] past the end returns undefined,
  // which propagates NaN through mean/var/sum and poisons the SQI buffer. Just
  // return prevSqi unchanged until we have a full window.
  if (len < EEG_SQI_WINDOW) return prevSqi
  const firstWinStart = Math.max(0, len - EEG_SQI_WINDOW - newCount + 1)
  const lastWinStart = Math.max(0, len - EEG_SQI_WINDOW)
  const updatedAmp = new Array<number>(EEG_SQI_WINDOW + newCount).fill(0)
  const updatedFreq = new Array<number>(EEG_SQI_WINDOW + newCount).fill(0)
  for (let i = firstWinStart; i <= lastWinStart; i++) {
    let mean = 0
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) mean += filteredVals[j]
    mean /= EEG_SQI_WINDOW
    let ampSum = 0
    let varSum = 0
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) {
      const dev = filteredVals[j] - mean
      const amp = Math.abs(dev)
      if (amp <= EEG_AMP_THRESHOLD) ampSum += 1
      else {
        const excess = Math.min((amp - EEG_AMP_THRESHOLD) / EEG_AMP_THRESHOLD, 1)
        ampSum += Math.max(0, 1 - excess)
      }
      varSum += dev * dev
    }
    const ampAvg = ampSum / EEG_SQI_WINDOW
    const variance = varSum / EEG_SQI_WINDOW
    const freqScore = Math.max(
      0,
      Math.min(1, 1 - variance / (EEG_AMP_THRESHOLD * EEG_AMP_THRESHOLD)),
    )
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) {
      const off = j - firstWinStart
      if (off >= 0 && off < updatedAmp.length) {
        updatedAmp[off] = ampAvg
        updatedFreq[off] = freqScore
      }
    }
  }
  const newPts: DataPoint[] = new Array(newCount)
  for (let i = 0; i < newCount; i++) {
    const samplePos = len - newCount + i
    const off = samplePos - firstWinStart
    const a = updatedAmp[off] ?? 0
    const f = updatedFreq[off] ?? 0
    newPts[i] = { index: startIdxForFirstNew + i, value: (0.7 * a + 0.3 * f) * 100 }
  }
  return appendCap(prevSqi, newPts, cap)
}

export const createEegBufferState = (): EegBufferState => ({
  fp1: [],
  fp2: [],
  fp1Raw: [],
  fp2Raw: [],
  sqCh1: [],
  sqCh2: [],
  sampleIndex: 0,
  fp1Filter: createEegChannelFilter(),
  fp2Filter: createEegChannelFilter(),
  rawLeadOff: { ch1: false, ch2: false },
})

export function ingestEegRaw(prev: EegBufferState, samples: EegRawSample[]): EegBufferState {
  if (samples.length === 0) return prev
  const n = samples.length
  const fp1Filter = { ...prev.fp1Filter }
  const fp2Filter = { ...prev.fp2Filter }
  const newFp1: DataPoint[] = new Array(n)
  const newFp2: DataPoint[] = new Array(n)
  const newFp1Raw = new Array<number>(n)
  const newFp2Raw = new Array<number>(n)
  let idx = prev.sampleIndex
  for (let k = 0; k < n; k++) {
    const s = samples[k]
    const v1 = processEegSample(fp1Filter, s.fp1)
    const v2 = processEegSample(fp2Filter, s.fp2)
    newFp1[k] = { index: idx, value: v1 }
    newFp2[k] = { index: idx, value: v2 }
    newFp1Raw[k] = s.fp1
    newFp2Raw[k] = s.fp2
    idx++
  }

  // Append filtered point buffers first
  const fp1 = appendCap(prev.fp1, newFp1, EEG_BUFFER_SIZE)
  const fp2 = appendCap(prev.fp2, newFp2, EEG_BUFFER_SIZE)

  // Extract numeric arrays for SQI windowing (unavoidable but tight)
  const fp1Vals = new Array<number>(fp1.length)
  const fp2Vals = new Array<number>(fp2.length)
  for (let i = 0; i < fp1.length; i++) fp1Vals[i] = fp1[i].value
  for (let i = 0; i < fp2.length; i++) fp2Vals[i] = fp2[i].value

  const startIdxForFirstNew = idx - n
  const sqCh1 = appendEegSqiIncremental(prev.sqCh1, fp1Vals, n, startIdxForFirstNew, EEG_BUFFER_SIZE)
  const sqCh2 = appendEegSqiIncremental(prev.sqCh2, fp2Vals, n, startIdxForFirstNew, EEG_BUFFER_SIZE)

  const last = samples[n - 1]
  return {
    fp1,
    fp2,
    fp1Raw: appendCap(prev.fp1Raw, newFp1Raw, 500),
    fp2Raw: appendCap(prev.fp2Raw, newFp2Raw, 500),
    sqCh1,
    sqCh2,
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
