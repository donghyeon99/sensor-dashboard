// Design Ref: §3.1 — Pure RBJ biquad filter primitives, no React/store dependency
export interface BiquadState {
  x1: number
  x2: number
  y1: number
  y2: number
}

export interface BiquadCoefs {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

export const createBiquadState = (): BiquadState => ({ x1: 0, x2: 0, y1: 0, y2: 0 })

export function notchCoefs(sampleRate: number, f0: number, q: number): BiquadCoefs {
  const w0 = (2 * Math.PI * f0) / sampleRate
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  return {
    b0: 1 / a0,
    b1: (-2 * cos) / a0,
    b2: 1 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  }
}

export function highpassCoefs(sampleRate: number, f0: number, q: number): BiquadCoefs {
  const w0 = (2 * Math.PI * f0) / sampleRate
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  return {
    b0: ((1 + cos) / 2) / a0,
    b1: (-(1 + cos)) / a0,
    b2: ((1 + cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  }
}

export function lowpassCoefs(sampleRate: number, f0: number, q: number): BiquadCoefs {
  const w0 = (2 * Math.PI * f0) / sampleRate
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  return {
    b0: ((1 - cos) / 2) / a0,
    b1: (1 - cos) / a0,
    b2: ((1 - cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  }
}

export function processBiquad(coefs: BiquadCoefs, state: BiquadState, x: number): number {
  const y =
    coefs.b0 * x +
    coefs.b1 * state.x1 +
    coefs.b2 * state.x2 -
    coefs.a1 * state.y1 -
    coefs.a2 * state.y2
  state.x2 = state.x1
  state.x1 = x
  state.y2 = state.y1
  state.y1 = y
  return y
}
