// SSE raw sample types
export interface EegRawSample {
  fp1: number
  fp2: number
  signalQuality: number
  leadOff?: { ch1: boolean; ch2: boolean }
  timestamp: number
}

export interface PpgRawSample {
  ir: number
  red: number
  timestamp: number
}

export interface AccSample {
  x: number
  y: number
  z: number
  timestamp: number
}

// Analysis types
export interface EegAnalysis {
  attention: number
  focusIndex: number
  relaxationIndex: number
  stressIndex: number
  cognitiveLoad: number
  emotionalBalance: number
  meditationLevel: number
  totalPower: number
  signalQuality?: number
  ch1LeadOff?: boolean
  ch2LeadOff?: boolean
}

export interface PpgAnalysis {
  bpm: number
  spo2: number | null
}

// SSE message payload
export interface SensorPayload {
  eegRaw?: EegRawSample[]
  eegAnalysis?: EegAnalysis & Record<string, unknown>
  ppgAnalysis?: PpgAnalysis & Record<string, unknown>
  ppgRaw?: PpgRawSample[]
  accelerometer?: AccSample[]
  battery?: { level: number }
}

export interface SSEMessage {
  type?: string
  deviceId: string
  timestamp: number
  payload?: SensorPayload
  subscribers?: number
  messageCount?: number
}

// Buffer point for charts
export interface DataPoint {
  index: number
  value: number
}

// Category tabs
export type Category = 'eeg' | 'ppg' | 'acc'
