// Power spectrum: DFT for chart display, linkband-compatible biquad + Morlet for band power
import {
  bandpassCoefs,
  calcLinkbandBandpassQ,
  calcLinkbandNotchQ,
  createBiquadState,
  notchCoefs,
  processBiquad,
} from './biquad'

export interface BandRange {
  key: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'
  fMin: number
  fMax: number
}

// Match sdk.linkband.store UI band ranges (gamma capped at 45Hz, not 50)
export const EEG_BANDS: BandRange[] = [
  { key: 'delta', fMin: 1, fMax: 4 },
  { key: 'theta', fMin: 4, fMax: 8 },
  { key: 'alpha', fMin: 8, fMax: 13 },
  { key: 'beta', fMin: 13, fMax: 30 },
  { key: 'gamma', fMin: 30, fMax: 45 },
]

const MIN_SAMPLES = 64
const DFT_WINDOW = 256

function stripTransient(data: number[]): number[] {
  let start = 0
  while (start < data.length && data[start] === 0) start++
  return start > 0 ? data.slice(start) : data
}

// ── DFT (for spectrum chart) ──

function dftPowerDb(samples: number[], N: number, freq: number, sampleRate: number): number {
  let real = 0
  let imag = 0
  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * freq * n) / sampleRate
    real += samples[n] * Math.cos(angle)
    imag -= samples[n] * Math.sin(angle)
  }
  const power = (real * real + imag * imag) / N
  return power > 0 ? 10 * Math.log10(power) : -100
}

export function computeSpectrum(
  rawData: number[],
  sampleRate: number,
  kMin = 1,
  kMax = 45,
  // cacheKey kept for API compatibility but no longer used — caching caused
  // ch2 (or any weak-signal channel) to freeze at a stale value when the
  // signal briefly dipped below the noise threshold.
  _cacheKey?: string,
): [number, number][] {
  const data = stripTransient(rawData)
  if (data.length < MIN_SAMPLES) return []
  const samples = data.slice(-Math.min(DFT_WINDOW, data.length))
  // Remove residual DC
  let mean = 0
  for (let i = 0; i < samples.length; i++) mean += samples[i]
  mean /= samples.length
  const dc = samples.map((v) => v - mean)

  const N = dc.length
  const out: [number, number][] = new Array(kMax - kMin + 1)
  for (let freq = kMin; freq <= kMax; freq++) {
    out[freq - kMin] = [freq, dftPowerDb(dc, N, freq, sampleRate)]
  }
  return out
}

// ── linkband-compatible 2nd-order biquad filter chain (for band power) ──

const BAND_SR = 250

// Pre-computed coefficients matching sdk.linkband.store exactly:
// Notch: f0=60Hz, Q=calcLinkbandNotchQ(60,2) ≈ 20.01 (very narrow notch)
// Bandpass: 1-45Hz center=23, Q=calcLinkbandBandpassQ(1,45) ≈ 1.524
const BP_NOTCH_COEFS = notchCoefs(BAND_SR, 60, calcLinkbandNotchQ(60, 2))
const BP_BANDPASS_COEFS = bandpassCoefs(
  BAND_SR,
  (1 + 45) / 2,
  calcLinkbandBandpassQ(1, 45),
)

/** Apply linkband-compatible batch filter on raw EEG: biquad notch → biquad bandpass, skip 250 transient. */
function batchFilter(raw: number[]): number[] {
  const notchState = createBiquadState()
  const bpState = createBiquadState()
  const out = new Array<number>(raw.length)
  for (let i = 0; i < raw.length; i++) {
    const n = processBiquad(BP_NOTCH_COEFS, notchState, raw[i])
    out[i] = processBiquad(BP_BANDPASS_COEFS, bpState, n)
  }
  return out.slice(250) // skip transient like linkband
}

// ── Morlet Wavelet (for band power) ──

function morletPowerDb(data: number[], freq: number): number {
  const sigma = 7
  const idealLen = Math.floor(sigma * BAND_SR / freq)
  const minLen = Math.max(32, Math.floor(BAND_SR / freq))
  const maxLen = Math.min(data.length, Math.floor(2 * BAND_SR / freq))
  const waveletLen = Math.max(minLen, Math.min(maxLen, idealLen))
  if (waveletLen > data.length) return -100

  const halfLen = (waveletLen - 1) / 2
  const norm = Math.pow(Math.PI, -0.25) * Math.sqrt(2 / sigma)
  const wReal = new Array<number>(waveletLen)
  const wImag = new Array<number>(waveletLen)
  for (let i = 0; i < waveletLen; i++) {
    const t = (i - halfLen) / BAND_SR
    const g = Math.exp(-t * t / (2 * sigma * sigma))
    const a = 2 * Math.PI * freq * t
    wReal[i] = norm * g * Math.cos(a)
    wImag[i] = norm * g * Math.sin(a)
  }

  const convLen = data.length - waveletLen + 1
  if (convLen <= 0) return -100
  let totalPower = 0
  for (let i = 0; i < convLen; i++) {
    let re = 0, im = 0
    for (let j = 0; j < waveletLen; j++) {
      const s = data[i + j]
      re += s * wReal[j]
      im += s * wImag[j]
    }
    totalPower += re * re + im * im
  }
  const avg = totalPower / convLen
  return avg > 0 ? 10 * Math.log10(avg) : -100
}

// ── Band Power ──

export interface BandPowerLinearDb {
  linear: number
  db: number
}

/** Compute band power using linkband-style filters + Morlet on raw EEG data. */
export function computeBandPower(
  rawEeg: number[],
  _sampleRate: number,
  fMin: number,
  fMax: number,
  // cacheKey kept for API compatibility but unused — caching froze weak-signal
  // channels at stale values once isNoSignal triggered.
  _cacheKey?: string,
): BandPowerLinearDb {
  if (rawEeg.length < 300) return { linear: 0, db: 0 }

  // Apply linkband-style batch filter on last 500 raw samples
  const batch = rawEeg.slice(-500)
  const filtered = batchFilter(batch)

  if (filtered.length < MIN_SAMPLES) return { linear: 0, db: 0 }

  let dbSum = 0
  let count = 0
  for (let freq = fMin; freq <= fMax; freq++) {
    dbSum += morletPowerDb(filtered, freq)
    count++
  }
  const avgDb = count > 0 ? dbSum / count : 0
  return { linear: avgDb, db: avgDb }
}

// ── Combined EEG Power ──

export interface ComputedEegPower {
  bands: Record<
    BandRange['key'],
    { ch1Linear: number; ch2Linear: number; ch1Db: number; ch2Db: number }
  >
  totalPowerLinear: number
}

/** Compute band power from RAW EEG data (not pre-filtered). */
export function computeEegPower(
  fp1Raw: number[],
  fp2Raw: number[],
  sampleRate: number,
): ComputedEegPower | null {
  if (fp1Raw.length < 300 || fp2Raw.length < 300) return null
  const bands = {} as ComputedEegPower['bands']
  let totalLinear = 0
  for (const band of EEG_BANDS) {
    const ch1 = computeBandPower(fp1Raw, sampleRate, band.fMin, band.fMax, `ch1_${band.key}`)
    const ch2 = computeBandPower(fp2Raw, sampleRate, band.fMin, band.fMax, `ch2_${band.key}`)
    bands[band.key] = {
      ch1Linear: ch1.linear,
      ch2Linear: ch2.linear,
      ch1Db: ch1.db,
      ch2Db: ch2.db,
    }
    totalLinear += (ch1.linear + ch2.linear) / 2
  }
  return { bands, totalPowerLinear: totalLinear }
}
