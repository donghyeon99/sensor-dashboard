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

export interface BandPowerLinearDb {
  linear: number
  db: number
}

export function computeBandPowerLinearDb(
  data: { value: number }[],
  sampleRate: number,
  fMin: number,
  fMax: number,
): BandPowerLinearDb {
  if (data.length < 64) return { linear: 0, db: 0 }
  const N = Math.min(256, data.length)
  const samples = data.slice(-N).map((p) => p.value)
  let linearSum = 0
  let dbSum = 0
  let count = 0
  for (let freq = fMin; freq <= fMax; freq++) {
    let realSum = 0, imagSum = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * freq * n) / sampleRate
      realSum += samples[n] * Math.cos(angle)
      imagSum -= samples[n] * Math.sin(angle)
    }
    const mag = Math.sqrt(realSum * realSum + imagSum * imagSum) / N
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
  bands: Record<BandRange['key'], { ch1Linear: number; ch2Linear: number; ch1Db: number; ch2Db: number }>
  totalPowerLinear: number
}

export function computeEegPower(
  fp1: { value: number }[],
  fp2: { value: number }[],
  sampleRate: number,
): ComputedEegPower | null {
  if (fp1.length < 64 || fp2.length < 64) return null
  const bands = {} as ComputedEegPower['bands']
  let totalLinear = 0
  for (const band of EEG_BANDS) {
    const ch1 = computeBandPowerLinearDb(fp1, sampleRate, band.fMin, band.fMax)
    const ch2 = computeBandPowerLinearDb(fp2, sampleRate, band.fMin, band.fMax)
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
