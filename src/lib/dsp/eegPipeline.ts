// Design Ref: §3.1 — EEG filter cascade (notch → HP → LP) as pure function
import {
  createBiquadState,
  highpassCoefs,
  lowpassCoefs,
  notchCoefs,
  processBiquad,
  type BiquadState,
} from './biquad'

export const EEG_SAMPLE_RATE = 250
export const EEG_TRANSIENT_SAMPLES = 250

const BUTTERWORTH_Q = 1 / Math.SQRT2
const NOTCH_COEFS = notchCoefs(EEG_SAMPLE_RATE, 60, 2) // Q=2 matches linkband
const HP_COEFS = highpassCoefs(EEG_SAMPLE_RATE, 1, BUTTERWORTH_Q)
const LP_COEFS = lowpassCoefs(EEG_SAMPLE_RATE, 45, BUTTERWORTH_Q)

export interface EegChannelFilter {
  notch: BiquadState
  hp: BiquadState
  lp: BiquadState
  samplesProcessed: number
}

export const createEegChannelFilter = (): EegChannelFilter => ({
  notch: createBiquadState(),
  hp: createBiquadState(),
  lp: createBiquadState(),
  samplesProcessed: 0,
})

/**
 * Process a single EEG raw sample through the notch→HP→LP cascade.
 * Mutates `filter` in place and returns the filtered value (0 during transient warm-up).
 */
export function processEegSample(filter: EegChannelFilter, sample: number): number {
  const n = processBiquad(NOTCH_COEFS, filter.notch, sample)
  const h = processBiquad(HP_COEFS, filter.hp, n)
  const l = processBiquad(LP_COEFS, filter.lp, h)
  const out = filter.samplesProcessed < EEG_TRANSIENT_SAMPLES ? 0 : l
  filter.samplesProcessed++
  return out
}

/**
 * Amplitude-based EEG SQI matching sdk.linkband.store logic.
 * Combined SQI = 70% amplitude + 30% frequency (variance-based).
 * Window: 125 samples (~0.5s @250Hz), amplitude threshold: 150μV.
 * Local DC removed per window to match linkband's mean subtraction.
 */
const EEG_SQI_WINDOW = 125
const EEG_AMP_THRESHOLD = 150

export function calculateEegSqi(filteredData: number[]): number[] {
  const len = filteredData.length
  const ampSqi = new Array<number>(len).fill(0)
  const freqSqi = new Array<number>(len).fill(0)

  for (let i = 0; i <= len - EEG_SQI_WINDOW; i++) {
    // Remove local DC offset (matches linkband's approach)
    let mean = 0
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) mean += filteredData[j]
    mean /= EEG_SQI_WINDOW

    // Amplitude SQI (on DC-removed signal)
    let ampSum = 0
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) {
      const amp = Math.abs(filteredData[j] - mean)
      if (amp <= EEG_AMP_THRESHOLD) {
        ampSum += 1
      } else {
        const excess = Math.min((amp - EEG_AMP_THRESHOLD) / EEG_AMP_THRESHOLD, 1)
        ampSum += Math.max(0, 1 - excess)
      }
    }
    const ampAvg = ampSum / EEG_SQI_WINDOW

    // Frequency SQI (variance of DC-removed signal, normalized by threshold²)
    let varSum = 0
    for (let j = i; j < i + EEG_SQI_WINDOW; j++) varSum += (filteredData[j] - mean) ** 2
    const variance = varSum / EEG_SQI_WINDOW
    const freqScore = Math.max(0, Math.min(1, 1 - variance / (EEG_AMP_THRESHOLD * EEG_AMP_THRESHOLD)))

    for (let j = i; j < i + EEG_SQI_WINDOW && j < len; j++) {
      ampSqi[j] = ampAvg
      freqSqi[j] = freqScore
    }
  }

  // Combined: 70% amplitude + 30% frequency, scaled to 0-100%
  return ampSqi.map((a, i) => (0.7 * a + 0.3 * freqSqi[i]) * 100)
}
