// Design Ref: §3.2 — pure ingest for ACC raw + analysis
import type { AccAnalysis, AccSample, DataPoint } from '../../types/sensor'
import { ACC_BUFFER_SIZE, type AccBufferState } from './types'

export const createAccBufferState = (): AccBufferState => ({
  x: [],
  y: [],
  z: [],
  magnitude: [],
  sampleIndex: 0,
})

export function ingestAccRaw(prev: AccBufferState, samples: AccSample[]): AccBufferState {
  if (samples.length === 0) return prev
  const newX: DataPoint[] = []
  const newY: DataPoint[] = []
  const newZ: DataPoint[] = []
  const newMag: DataPoint[] = []
  let idx = prev.sampleIndex
  for (const s of samples) {
    newX.push({ index: idx, value: s.x })
    newY.push({ index: idx, value: s.y })
    newZ.push({ index: idx, value: s.z })
    const mag = s.magnitude ?? Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z)
    newMag.push({ index: idx, value: mag })
    idx++
  }
  return {
    x: [...prev.x, ...newX].slice(-ACC_BUFFER_SIZE),
    y: [...prev.y, ...newY].slice(-ACC_BUFFER_SIZE),
    z: [...prev.z, ...newZ].slice(-ACC_BUFFER_SIZE),
    magnitude: [...prev.magnitude, ...newMag].slice(-ACC_BUFFER_SIZE),
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
