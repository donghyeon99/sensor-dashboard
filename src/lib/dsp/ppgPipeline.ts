// Design Ref: §3.2 D3 — PPG 0.5-5Hz bandpass (HP + LP biquad cascade, no notch needed @50Hz)
import {
  createBiquadState,
  highpassCoefs,
  lowpassCoefs,
  processBiquad,
  type BiquadState,
} from './biquad'

export const PPG_SAMPLE_RATE = 50
export const PPG_TRANSIENT_SAMPLES = 50 // ~1s warm-up

const BUTTERWORTH_Q = 1 / Math.SQRT2
const HP_COEFS = highpassCoefs(PPG_SAMPLE_RATE, 0.5, BUTTERWORTH_Q)
const LP_COEFS = lowpassCoefs(PPG_SAMPLE_RATE, 5.0, BUTTERWORTH_Q)

export interface PpgChannelFilter {
  hp: BiquadState
  lp: BiquadState
  samplesProcessed: number
}

export const createPpgChannelFilter = (): PpgChannelFilter => ({
  hp: createBiquadState(),
  lp: createBiquadState(),
  samplesProcessed: 0,
})

/**
 * Process a single PPG raw sample through HP(0.5Hz) → LP(5Hz) cascade.
 * Mutates `filter` and returns filtered value (0 during transient warm-up).
 */
export function processPpgSample(filter: PpgChannelFilter, sample: number): number {
  const h = processBiquad(HP_COEFS, filter.hp, sample)
  const l = processBiquad(LP_COEFS, filter.lp, h)
  const out = filter.samplesProcessed < PPG_TRANSIENT_SAMPLES ? 0 : l
  filter.samplesProcessed++
  return out
}
