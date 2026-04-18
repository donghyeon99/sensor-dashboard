// Design Ref: §3.2 — pure ingest for ACC raw + analysis
import type { AccAnalysis, AccSample, DataPoint } from '../../types/sensor'
import { ACC_BUFFER_SIZE, type AccBufferState } from './types'
import { appendCap } from './bufferUtil'

export const createAccBufferState = (): AccBufferState => ({
  x: [],
  y: [],
  z: [],
  magnitude: [],
  sampleIndex: 0,
})

export function ingestAccRaw(prev: AccBufferState, samples: AccSample[]): AccBufferState {
  if (samples.length === 0) return prev
  const n = samples.length
  const newX: DataPoint[] = new Array(n)
  const newY: DataPoint[] = new Array(n)
  const newZ: DataPoint[] = new Array(n)
  const newMag: DataPoint[] = new Array(n)
  let idx = prev.sampleIndex
  for (let k = 0; k < n; k++) {
    const s = samples[k]
    newX[k] = { index: idx, value: s.x }
    newY[k] = { index: idx, value: s.y }
    newZ[k] = { index: idx, value: s.z }
    const mag = s.magnitude ?? Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z)
    newMag[k] = { index: idx, value: mag }
    idx++
  }
  return {
    x: appendCap(prev.x, newX, ACC_BUFFER_SIZE),
    y: appendCap(prev.y, newY, ACC_BUFFER_SIZE),
    z: appendCap(prev.z, newZ, ACC_BUFFER_SIZE),
    magnitude: appendCap(prev.magnitude, newMag, ACC_BUFFER_SIZE),
    sampleIndex: idx,
  }
}

export function normalizeAccAnalysis(raw: Record<string, unknown>): AccAnalysis {
  const num = (k: string, fallback = 0): number => {
    const v = raw[k]
    return typeof v === 'number' ? v : fallback
  }
  const str = (k: string, fallback = 'unknown'): string => {
    const v = raw[k]
    return typeof v === 'string' ? v : fallback
  }
  return {
    activityState: str('activityState'),
    intensity: num('intensity'),
    stability: num('stability'),
    avgMovement: num('avgMovement'),
    maxMovement: num('maxMovement'),
  }
}
