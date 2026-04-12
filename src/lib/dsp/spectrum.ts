// Design Ref: §3.1 — DFT-based spectrum + band power computation
export interface BandRange {
  key: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'
  fMin: number
  fMax: number
}

export const EEG_BANDS: BandRange[] = [
  { key: 'delta', fMin: 1, fMax: 4 },
  { key: 'theta', fMin: 4, fMax: 8 },
  { key: 'alpha', fMin: 8, fMax: 13 },
  { key: 'beta', fMin: 13, fMax: 30 },
  { key: 'gamma', fMin: 30, fMax: 45 },
]

const MIN_WINDOW = 64
const MAX_WINDOW = 256

/** Returns (frequency, dB) pairs for integer Hz bins from kMin..kMax. */
export function computeSpectrum(
  data: number[],
  sampleRate: number,
  kMin = 1,
  kMax = 45,
): [number, number][] {
  if (data.length < MIN_WINDOW) return []
  const N = Math.min(MAX_WINDOW, data.length)
  const samples = data.slice(-N)
  const out: [number, number][] = []
  for (let k = kMin; k <= kMax; k++) {
    let real = 0
    let imag = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / sampleRate
      real += samples[n] * Math.cos(angle)
      imag -= samples[n] * Math.sin(angle)
    }
    const mag = Math.sqrt(real * real + imag * imag) / N
    const db = mag > 0 ? 20 * Math.log10(mag + 1) : 0
    out.push([k, db])
  }
  return out
}

export interface BandPowerLinearDb {
  linear: number
  db: number
}

export function computeBandPower(
  data: number[],
  sampleRate: number,
  fMin: number,
  fMax: number,
): BandPowerLinearDb {
  if (data.length < MIN_WINDOW) return { linear: 0, db: 0 }
  const N = Math.min(MAX_WINDOW, data.length)
  const samples = data.slice(-N)
  let linearSum = 0
  let dbSum = 0
  let count = 0
  for (let freq = fMin; freq <= fMax; freq++) {
    let real = 0
    let imag = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * freq * n) / sampleRate
      real += samples[n] * Math.cos(angle)
      imag -= samples[n] * Math.sin(angle)
    }
    const mag = Math.sqrt(real * real + imag * imag) / N
    linearSum += mag * mag
    dbSum += mag > 0 ? 20 * Math.log10(mag + 1) : 0
    count++
  }
  return {
    linear: linearSum,
    db: count > 0 ? dbSum / count : 0,
  }
}

export interface ComputedEegPower {
  bands: Record<
    BandRange['key'],
    { ch1Linear: number; ch2Linear: number; ch1Db: number; ch2Db: number }
  >
  totalPowerLinear: number
}

export function computeEegPower(
  fp1: number[],
  fp2: number[],
  sampleRate: number,
): ComputedEegPower | null {
  if (fp1.length < MIN_WINDOW || fp2.length < MIN_WINDOW) return null
  const bands = {} as ComputedEegPower['bands']
  let totalLinear = 0
  for (const band of EEG_BANDS) {
    const ch1 = computeBandPower(fp1, sampleRate, band.fMin, band.fMax)
    const ch2 = computeBandPower(fp2, sampleRate, band.fMin, band.fMax)
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
