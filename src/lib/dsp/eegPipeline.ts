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
const NOTCH_COEFS = notchCoefs(EEG_SAMPLE_RATE, 60, 30)
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
