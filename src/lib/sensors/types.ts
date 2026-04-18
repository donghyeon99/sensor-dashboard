// Design Ref: §3.2 — internal buffer state for each sensor domain
import type { EegChannelFilter } from '../dsp/eegPipeline'
import type { PpgChannelFilter } from '../dsp/ppgPipeline'
import type { DataPoint } from '../../types/sensor'

export interface EegBufferState {
  fp1: DataPoint[]
  fp2: DataPoint[]
  fp1Raw: number[]
  fp2Raw: number[]
  sqCh1: DataPoint[]
  sqCh2: DataPoint[]
  sampleIndex: number
  fp1Filter: EegChannelFilter
  fp2Filter: EegChannelFilter
  rawLeadOff: { ch1: boolean; ch2: boolean }
}

export interface PpgSqiData {
  redSQI: DataPoint[]
  irSQI: DataPoint[]
  overallSQI: DataPoint[]
}

export interface PpgBufferState {
  ir: DataPoint[]
  red: DataPoint[]
  irFiltered: DataPoint[]
  redFiltered: DataPoint[]
  irFilter: PpgChannelFilter
  redFilter: PpgChannelFilter
  sampleIndex: number
  sqi: PpgSqiData
  bpmHistory: DataPoint[]
  spo2History: DataPoint[]
  historyIndex: number
}

export interface AccBufferState {
  x: DataPoint[]
  y: DataPoint[]
  z: DataPoint[]
  magnitude: DataPoint[]
  sampleIndex: number
}

export const EEG_BUFFER_SIZE = 1000 // ~4s @ 250Hz (matches linkband maxDataPoints)
export const PPG_BUFFER_SIZE = 400 // ~8s @ 50Hz (matches linkband maxBufferSize)
export const ACC_BUFFER_SIZE = 200 // ~6.7s @ 30Hz
export const HISTORY_SIZE = 120 // ~2min analysis trend
