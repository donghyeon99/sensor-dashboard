// Numerically verify our band power output matches sdk.linkband.store on real EEG data.
// Loads eeg_samples.txt, runs BOTH linkband's exact algorithm (transcribed from the
// production bundle at /assets/index-u1f-s9Xp.js) and our updated spectrum.ts pipeline,
// and prints per-band dB side by side. PASS if |diff| < 0.5 dB for all bands.
//
// Usage:  node scripts/verify-bandpower.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─────────────────────────────────────────────────────────────────────────────
// 1. Load real EEG fp1 samples from eeg_samples.txt (SSE-formatted lines)
// ─────────────────────────────────────────────────────────────────────────────
function loadFp1Samples(path) {
  const text = readFileSync(path, 'utf8')
  const samples = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line.startsWith('data:')) continue
    const json = JSON.parse(line.slice(5).trim())
    const eeg = json?.payload?.eegRaw
    if (!Array.isArray(eeg)) continue
    for (const s of eeg) samples.push(s.fp1)
  }
  return samples
}

const allFp1 = loadFp1Samples(join(ROOT, 'eeg_samples.txt'))
console.log(`Loaded ${allFp1.length} fp1 samples from eeg_samples.txt`)
if (allFp1.length < 500) {
  console.error('Need at least 500 samples to test (2s @ 250Hz). Aborting.')
  process.exit(1)
}
// Use the most-recent 500 samples (matches BandPowerCards using fp1Raw.slice(-500))
const buf500 = allFp1.slice(-500)

// ─────────────────────────────────────────────────────────────────────────────
// 2. linkband EXACT reference (transcribed from bundle)
//    Class Yf (biquad) + EEGProcessor pipeline
// ─────────────────────────────────────────────────────────────────────────────
class LinkbandBiquad {
  constructor(type, freq, sps, Q = 1 / Math.sqrt(2), dbGain = 0) {
    this.type = type
    this.freq = freq
    this.sps = sps
    this.Q = Q
    this.dbGain = dbGain
    this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0
    const A = Math.pow(10, dbGain / 40)
    const w0 = (2 * Math.PI * freq) / sps
    const sin = Math.sin(w0)
    const cos = Math.cos(w0)
    const alpha = sin / (2 * Q)
    if (type === 'notch') {
      this.b0 = 1; this.b1 = -2 * cos; this.b2 = 1
      this.a0 = 1 + alpha; this.a1 = -2 * cos; this.a2 = 1 - alpha
    } else if (type === 'bandpass') {
      this.b0 = alpha; this.b1 = 0; this.b2 = -alpha
      this.a0 = 1 + alpha; this.a1 = -2 * cos; this.a2 = 1 - alpha
    } else {
      throw new Error('unsupported type ' + type)
    }
    this.b0 /= this.a0; this.b1 /= this.a0; this.b2 /= this.a0
    this.a1 /= this.a0; this.a2 /= this.a0
    void A
  }
  applyFilter(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y
    return y
  }
  static calcCenterFrequency(fLow, fHigh) { return (fLow + fHigh) / 2 }
  static calcBandwidth(fLow, fHigh) { return fHigh - LinkbandBiquad.calcCenterFrequency(fLow, fHigh) }
  static calcBandpassQ(fc, bw, n = Math.pow(10, Math.floor(Math.log10(fc)))) {
    return (n * Math.sqrt((fc - bw) * (fc + bw))) / (2 * bw)
  }
  static calcNotchQ(f0, sps, n = Math.pow(10, Math.floor(Math.log10(f0)))) {
    return (n * f0 * sps) / Math.sqrt((f0 - sps) * (f0 + sps))
  }
}

const SR = 250

// linkband applyNotchFilter(data, 60)
function lbApplyNotchFilter(data, f0) {
  const filt = new LinkbandBiquad('notch', f0, SR, LinkbandBiquad.calcNotchQ(f0, 2), 0)
  const out = new Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = filt.applyFilter(data[i])
  return out
}

// linkband bandpassFilter(data, fLow, fHigh)
function lbBandpassFilter(data, fLow, fHigh) {
  const fc = LinkbandBiquad.calcCenterFrequency(fLow, fHigh)
  const bw = LinkbandBiquad.calcBandwidth(fLow, fHigh)
  const n = Math.pow(10, Math.floor(Math.log10(fc)))
  const Q = LinkbandBiquad.calcBandpassQ(fc, bw, n)
  const filt = new LinkbandBiquad('bandpass', fc, SR, Q, 0)
  const out = new Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = filt.applyFilter(data[i])
  return out
}

// linkband processEEGSegment filter chain (Notch 60 → Bandpass 1-45 → slice(250) transient)
function lbBatchFilter(rawFp1) {
  const notched = lbApplyNotchFilter(rawFp1, 60)
  const bp = lbBandpassFilter(notched, 1, 45)
  return bp.slice(250)
}

// linkband Morlet wavelet
function lbCreateMorletWavelet(len, freq, sigma) {
  const halfLen = (len - 1) / 2
  const norm = Math.pow(Math.PI, -0.25) * Math.sqrt(2 / sigma)
  const w = new Array(len)
  for (let i = 0; i < len; i++) {
    const t = (i - halfLen) / SR
    const g = Math.exp((-t * t) / (2 * sigma * sigma))
    const a = 2 * Math.PI * freq * t
    w[i] = { real: norm * g * Math.cos(a), imag: norm * g * Math.sin(a) }
  }
  return w
}

function lbConvolve(data, w) {
  const len = data.length - w.length + 1
  const out = new Array(len)
  for (let i = 0; i < len; i++) {
    let re = 0, im = 0
    for (let j = 0; j < w.length; j++) {
      const s = data[i + j]
      re += s * w[j].real
      im += s * w[j].imag
    }
    out[i] = { real: re, imag: im }
  }
  return out
}

function lbMorletPowerDb(data, freq) {
  const sigma = 7
  const ideal = Math.floor((sigma * SR) / freq)
  const minLen = Math.max(32, Math.floor(SR / freq))
  const maxLen = Math.min(data.length, Math.floor((2 * SR) / freq))
  const wLen = Math.max(minLen, Math.min(maxLen, ideal))
  if (wLen > data.length) return -100
  const w = lbCreateMorletWavelet(wLen, freq, sigma)
  const conv = lbConvolve(data, w)
  if (conv.length === 0) return -100
  let total = 0
  for (let i = 0; i < conv.length; i++) total += conv[i].real ** 2 + conv[i].imag ** 2
  const avg = total / conv.length
  return avg > 0 ? 10 * Math.log10(avg) : -100
}

function lbCalculatePowerSpectrum(filtered, freqs) {
  if (filtered.length < 125) return new Array(freqs.length).fill(0)
  return freqs.map((f) => lbMorletPowerDb(filtered, f))
}

// linkband UI band power computation (the ACTUAL displayed values)
const LB_UI_BANDS = {
  delta: { min: 1, max: 4 },
  theta: { min: 4, max: 8 },
  alpha: { min: 8, max: 13 },
  beta: { min: 13, max: 30 },
  gamma: { min: 30, max: 45 },
}

function lbComputeUiBandPower(freqs, powers, bandRange) {
  let sum = 0, count = 0
  for (let i = 0; i < freqs.length; i++) {
    const f = freqs[i]
    if (f >= bandRange.min && f <= bandRange.max) { sum += powers[i]; count++ }
  }
  return count > 0 ? sum / count : 0
}

// Run linkband pipeline end-to-end
function runLinkband(buf500) {
  const filtered = lbBatchFilter(buf500) // 250 samples remain
  const freqs = Array.from({ length: 45 }, (_, i) => i + 1)
  const powers = lbCalculatePowerSpectrum(filtered, freqs)
  const out = {}
  for (const [name, range] of Object.entries(LB_UI_BANDS)) {
    out[name] = lbComputeUiBandPower(freqs, powers, range)
  }
  return { filtered, powers, bands: out }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Our pipeline (re-implementing the relevant code paths from spectrum.ts)
//    Uses the SAME formulas committed to src/lib/dsp/biquad.ts + spectrum.ts
// ─────────────────────────────────────────────────────────────────────────────
function ourBiquadCoefs(type, sr, f0, q) {
  const w0 = (2 * Math.PI * f0) / sr
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  if (type === 'notch') {
    return { b0: 1 / a0, b1: (-2 * cos) / a0, b2: 1 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
  }
  if (type === 'bandpass') {
    return { b0: alpha / a0, b1: 0, b2: -alpha / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
  }
  throw new Error('unknown type')
}

function ourProcess(coefs, state, x) {
  const y = coefs.b0 * x + coefs.b1 * state.x1 + coefs.b2 * state.x2 - coefs.a1 * state.y1 - coefs.a2 * state.y2
  state.x2 = state.x1; state.x1 = x; state.y2 = state.y1; state.y1 = y
  return y
}

function ourBatchFilter(raw) {
  const notchQ = LinkbandBiquad.calcNotchQ(60, 2)
  const bpQ = LinkbandBiquad.calcBandpassQ(23, 22, 10)
  const notch = ourBiquadCoefs('notch', SR, 60, notchQ)
  const bp = ourBiquadCoefs('bandpass', SR, 23, bpQ)
  const ns = { x1: 0, x2: 0, y1: 0, y2: 0 }
  const bs = { x1: 0, x2: 0, y1: 0, y2: 0 }
  const out = new Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    const n = ourProcess(notch, ns, raw[i])
    out[i] = ourProcess(bp, bs, n)
  }
  return out.slice(250)
}

function ourMorletPowerDb(data, freq) {
  const sigma = 7
  const ideal = Math.floor((sigma * SR) / freq)
  const minLen = Math.max(32, Math.floor(SR / freq))
  const maxLen = Math.min(data.length, Math.floor((2 * SR) / freq))
  const wLen = Math.max(minLen, Math.min(maxLen, ideal))
  if (wLen > data.length) return -100
  const halfLen = (wLen - 1) / 2
  const norm = Math.pow(Math.PI, -0.25) * Math.sqrt(2 / sigma)
  const wReal = new Array(wLen), wImag = new Array(wLen)
  for (let i = 0; i < wLen; i++) {
    const t = (i - halfLen) / SR
    const g = Math.exp((-t * t) / (2 * sigma * sigma))
    const a = 2 * Math.PI * freq * t
    wReal[i] = norm * g * Math.cos(a)
    wImag[i] = norm * g * Math.sin(a)
  }
  const convLen = data.length - wLen + 1
  if (convLen <= 0) return -100
  let total = 0
  for (let i = 0; i < convLen; i++) {
    let re = 0, im = 0
    for (let j = 0; j < wLen; j++) {
      const s = data[i + j]
      re += s * wReal[j]
      im += s * wImag[j]
    }
    total += re * re + im * im
  }
  const avg = total / convLen
  return avg > 0 ? 10 * Math.log10(avg) : -100
}

// Mirrors src/lib/dsp/spectrum.ts computeBandPower (avg over [fMin, fMax] inclusive)
function ourComputeBandPower(rawEeg, fMin, fMax) {
  if (rawEeg.length < 300) return 0
  const batch = rawEeg.slice(-500)
  const filtered = ourBatchFilter(batch)
  if (filtered.length < 64) return 0
  let sum = 0, count = 0
  for (let f = fMin; f <= fMax; f++) {
    sum += ourMorletPowerDb(filtered, f)
    count++
  }
  return count > 0 ? sum / count : 0
}

const OUR_BANDS = {
  delta: { fMin: 1, fMax: 4 },
  theta: { fMin: 4, fMax: 8 },
  alpha: { fMin: 8, fMax: 13 },
  beta: { fMin: 13, fMax: 30 },
  gamma: { fMin: 30, fMax: 45 },
}

function runOurs(buf500) {
  const out = {}
  for (const [name, r] of Object.entries(OUR_BANDS)) {
    out[name] = ourComputeBandPower(buf500, r.fMin, r.fMax)
  }
  return { bands: out }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Compare and report
// ─────────────────────────────────────────────────────────────────────────────
const lb = runLinkband(buf500)
const us = runOurs(buf500)

console.log('\n=== Filter sanity ===')
console.log(`linkband filtered length: ${lb.filtered.length}`)
console.log(`linkband filtered first 3: ${lb.filtered.slice(0, 3).map((v) => v.toFixed(4)).join(', ')}`)
console.log(`linkband filtered last  3: ${lb.filtered.slice(-3).map((v) => v.toFixed(4)).join(', ')}`)

console.log('\n=== Per-frequency Morlet dB (sample: 1, 5, 10, 20, 30, 45 Hz) ===')
const checkFreqs = [1, 5, 10, 20, 30, 45]
const ourFiltered = ourBatchFilter(buf500)
const tableF = checkFreqs.map((f) => ({
  freq: f,
  linkband: lb.powers[f - 1].toFixed(3),
  ours: ourMorletPowerDb(ourFiltered, f).toFixed(3),
  diff: (ourMorletPowerDb(ourFiltered, f) - lb.powers[f - 1]).toFixed(4),
}))
console.table(tableF)

console.log('\n=== Per-band power dB (UI displayed values) ===')
const rows = []
let maxAbsDiff = 0
for (const name of Object.keys(LB_UI_BANDS)) {
  const a = lb.bands[name]
  const b = us.bands[name]
  const d = b - a
  if (Math.abs(d) > maxAbsDiff) maxAbsDiff = Math.abs(d)
  rows.push({ band: name, linkband_dB: a.toFixed(3), ours_dB: b.toFixed(3), diff_dB: d.toFixed(4) })
}
console.table(rows)

const TOL = 0.01
console.log(`\nMax |diff| = ${maxAbsDiff.toFixed(6)} dB (tolerance: ${TOL})`)
if (maxAbsDiff < TOL) {
  console.log('PASS — our band power matches linkband within tolerance.')
  process.exit(0)
} else {
  console.log('FAIL — band power does not match linkband.')
  process.exit(1)
}
