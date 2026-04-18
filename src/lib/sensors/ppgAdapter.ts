// Design Ref: §3.2, §3.3 — PPG raw ingest with 0.5-5Hz bandpass filter + amplitude-based SQI
import type { DataPoint, PpgAnalysis, PpgRawSample } from '../../types/sensor'
import { createPpgChannelFilter, processPpgSample } from '../dsp/ppgPipeline'
import { HISTORY_SIZE, PPG_BUFFER_SIZE, type PpgBufferState } from './types'
import { appendCap } from './bufferUtil'

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
  rawLeadOff: { ch1: false, ch2: false },
})

const SQI_WINDOW = 25 // mirrors ppgPipeline.ts SQI_WINDOW

/**
 * Incremental PPG SQI: only compute window positions that overlap the new tail.
 * Old positions whose 25-sample window has fully passed retain their final value.
 *
 * Worst case (1 new sample): ~25 window iterations × 25 samples = 625 ops, vs.
 * the previous full-buffer recompute of ~400 windows × 25 = 10K ops per channel.
 */
function appendSqiIncremental(
  prevSqi: DataPoint[],
  filteredVals: number[],         // full filtered value buffer (after appending new)
  newCount: number,               // how many tail samples are new this call
  startIdxForFirstNew: number,    // sampleIndex of the first new value
  cap: number,
): DataPoint[] {
  if (newCount === 0) return prevSqi
  const len = filteredVals.length
  // Guard: window math reads filteredVals[j] for j up to len-1+window. During
  // cold start (len < SQI_WINDOW) those reads go past the end and yield NaN
  // that contaminates downstream SQI/overall arrays. Return prev unchanged.
  if (len < SQI_WINDOW) return prevSqi
  // We need to compute SQI for sample positions [len - newCount, len - 1].
  // The last window covering position k starts at min(k, len - SQI_WINDOW).
  // Recompute window positions whose right edge is now ≥ len - newCount.
  const firstWinStart = Math.max(0, len - SQI_WINDOW - newCount + 1)
  const lastWinStart = Math.max(0, len - SQI_WINDOW)
  // Build a result map for affected sample positions
  const updated = new Array<number>(SQI_WINDOW + newCount).fill(0)
  // updated[k] holds SQI for position firstWinStart + k (we pick last write)
  for (let i = firstWinStart; i <= lastWinStart; i++) {
    let mean = 0
    for (let j = i; j < i + SQI_WINDOW; j++) mean += filteredVals[j]
    mean /= SQI_WINDOW
    let sum = 0
    for (let j = i; j < i + SQI_WINDOW; j++) {
      const amp = Math.abs(filteredVals[j] - mean)
      if (amp <= 250) sum += 1
      else {
        const excess = Math.min((amp - 250) / 250, 1)
        sum += Math.max(0, 1 - excess)
      }
    }
    const avg = (sum / SQI_WINDOW) * 100
    for (let j = i; j < i + SQI_WINDOW; j++) {
      const off = j - firstWinStart
      if (off >= 0 && off < updated.length) updated[off] = avg
    }
  }
  // Build new DataPoints for the truly new tail samples only
  const newPts: DataPoint[] = new Array(newCount)
  for (let i = 0; i < newCount; i++) {
    const samplePos = len - newCount + i
    const off = samplePos - firstWinStart
    newPts[i] = { index: startIdxForFirstNew + i, value: updated[off] ?? 0 }
  }
  return appendCap(prevSqi, newPts, cap)
}

export function ingestPpgRaw(prev: PpgBufferState, samples: PpgRawSample[]): PpgBufferState {
  if (samples.length === 0) return prev
  const irFilter = { ...prev.irFilter }
  const redFilter = { ...prev.redFilter }
  const newIr: DataPoint[] = new Array(samples.length)
  const newRed: DataPoint[] = new Array(samples.length)
  const newIrFilteredPts: DataPoint[] = new Array(samples.length)
  const newRedFilteredPts: DataPoint[] = new Array(samples.length)
  const newIrFilteredVals: number[] = new Array(samples.length)
  const newRedFilteredVals: number[] = new Array(samples.length)
  let idx = prev.sampleIndex
  for (let k = 0; k < samples.length; k++) {
    const s = samples[k]
    newIr[k] = { index: idx, value: s.ir }
    newRed[k] = { index: idx, value: s.red }
    const irVal = processPpgSample(irFilter, s.ir)
    const redVal = processPpgSample(redFilter, s.red)
    newIrFilteredPts[k] = { index: idx, value: irVal }
    newRedFilteredPts[k] = { index: idx, value: redVal }
    newIrFilteredVals[k] = irVal
    newRedFilteredVals[k] = redVal
    idx++
  }

  // Build current full filtered value buffers (only for SQI window calc)
  // Capped at PPG_BUFFER_SIZE so this stays bounded.
  const irFiltered = appendCap(prev.irFiltered, newIrFilteredPts, PPG_BUFFER_SIZE)
  const redFiltered = appendCap(prev.redFiltered, newRedFilteredPts, PPG_BUFFER_SIZE)

  // Extract numeric arrays for SQI (these allocations are unavoidable but kept tight)
  const irVals = new Array<number>(irFiltered.length)
  const redVals = new Array<number>(redFiltered.length)
  for (let i = 0; i < irFiltered.length; i++) irVals[i] = irFiltered[i].value
  for (let i = 0; i < redFiltered.length; i++) redVals[i] = redFiltered[i].value

  const startIdxForFirstNew = idx - samples.length
  const irSQI = appendSqiIncremental(
    prev.sqi.irSQI,
    irVals,
    samples.length,
    startIdxForFirstNew,
    PPG_BUFFER_SIZE,
  )
  const redSQI = appendSqiIncremental(
    prev.sqi.redSQI,
    redVals,
    samples.length,
    startIdxForFirstNew,
    PPG_BUFFER_SIZE,
  )

  // overallSQI = average of ir+red, computed only for new tail
  const newOverall: DataPoint[] = new Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const r = redSQI[redSQI.length - samples.length + i]?.value ?? 0
    const ir = irSQI[irSQI.length - samples.length + i]?.value ?? 0
    newOverall[i] = { index: startIdxForFirstNew + i, value: (r + ir) / 2 }
  }
  const overallSQI = appendCap(prev.sqi.overallSQI, newOverall, PPG_BUFFER_SIZE)

  // Track per-sample lead-off from latest sample (red=ch1, ir=ch2 convention)
  const lastSample = samples[samples.length - 1]
  const rawLeadOff = {
    ch1: Boolean(lastSample.leadOff?.ch1),
    ch2: Boolean(lastSample.leadOff?.ch2),
  }

  return {
    ...prev,
    ir: appendCap(prev.ir, newIr, PPG_BUFFER_SIZE),
    red: appendCap(prev.red, newRed, PPG_BUFFER_SIZE),
    irFiltered,
    redFiltered,
    sqi: { redSQI, irSQI, overallSQI },
    irFilter,
    redFilter,
    sampleIndex: idx,
    rawLeadOff,
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
