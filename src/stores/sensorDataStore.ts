import { create } from 'zustand'
import type { EegAnalysis, PpgAnalysis, AccAnalysis, DataPoint, SensorPayload } from '../types/sensor'

const EEG_BUFFER_SIZE = 1000  // ~4 seconds at 250Hz
const PPG_BUFFER_SIZE = 200   // ~4 seconds at 50Hz
const ACC_BUFFER_SIZE = 100   // ~4 seconds at 25Hz
const HISTORY_SIZE = 120      // ~2 minutes of analysis updates

interface SensorDataState {
  // EEG
  eegFp1: DataPoint[]
  eegFp2: DataPoint[]
  eegSignalQuality: DataPoint[]
  eegAnalysis: EegAnalysis | null
  eegSampleIndex: number

  // PPG
  ppgIr: DataPoint[]
  ppgRed: DataPoint[]
  ppgAnalysis: PpgAnalysis | null
  bpmHistory: DataPoint[]
  spo2History: DataPoint[]
  ppgSampleIndex: number
  ppgHistoryIndex: number

  // ACC
  accX: DataPoint[]
  accY: DataPoint[]
  accZ: DataPoint[]
  accMagnitude: DataPoint[]
  accSampleIndex: number
  accAnalysis: AccAnalysis | null

  // Battery
  batteryLevel: number | null

  // Stats
  messageCount: number

  // Actions
  updateFromPayload: (payload: SensorPayload) => void
  resetData: () => void
}

export const useSensorDataStore = create<SensorDataState>((set) => ({
  eegFp1: [],
  eegFp2: [],
  eegSignalQuality: [],
  eegAnalysis: null,
  eegSampleIndex: 0,

  ppgIr: [],
  ppgRed: [],
  ppgAnalysis: null,
  bpmHistory: [],
  spo2History: [],
  ppgSampleIndex: 0,
  ppgHistoryIndex: 0,

  accX: [],
  accY: [],
  accZ: [],
  accMagnitude: [],
  accSampleIndex: 0,
  accAnalysis: null,

  batteryLevel: null,
  messageCount: 0,

  updateFromPayload: (payload) => set((state) => {
    const updates: Partial<SensorDataState> = {
      messageCount: state.messageCount + 1,
    }

    // EEG Raw
    if (payload.eegRaw && payload.eegRaw.length > 0) {
      let idx = state.eegSampleIndex
      const newFp1: DataPoint[] = []
      const newFp2: DataPoint[] = []
      const newSQ: DataPoint[] = []
      for (const sample of payload.eegRaw) {
        newFp1.push({ index: idx, value: sample.fp1 })
        newFp2.push({ index: idx, value: sample.fp2 })
        // signalQuality: 0 = best, higher = worse → invert to 0-100% (100 = best)
        const sqValue = Math.max(0, 100 - (sample.signalQuality ?? 0))
        newSQ.push({ index: idx, value: sqValue })
        idx++
      }
      updates.eegFp1 = [...state.eegFp1, ...newFp1].slice(-EEG_BUFFER_SIZE)
      updates.eegFp2 = [...state.eegFp2, ...newFp2].slice(-EEG_BUFFER_SIZE)
      updates.eegSignalQuality = [...state.eegSignalQuality, ...newSQ].slice(-EEG_BUFFER_SIZE)
      updates.eegSampleIndex = idx
    }

    // EEG Analysis
    if (payload.eegAnalysis) {
      const a = payload.eegAnalysis
      updates.eegAnalysis = {
        attention: a.attention ?? 0,
        focusIndex: a.focusIndex ?? 0,
        relaxationIndex: a.relaxationIndex ?? 0,
        stressIndex: a.stressIndex ?? 0,
        cognitiveLoad: a.cognitiveLoad ?? 0,
        emotionalBalance: a.emotionalBalance ?? 0,
        meditationLevel: a.meditationLevel ?? 0,
        totalPower: a.totalPower ?? 0,
        signalQuality: a.signalQuality as number | undefined,
        ch1LeadOff: a.ch1LeadOff as boolean | undefined,
        ch2LeadOff: a.ch2LeadOff as boolean | undefined,
      }
    }

    // PPG Raw
    if (payload.ppgRaw && payload.ppgRaw.length > 0) {
      let idx = state.ppgSampleIndex
      const newIr: DataPoint[] = []
      const newRed: DataPoint[] = []
      for (const sample of payload.ppgRaw) {
        newIr.push({ index: idx, value: sample.ir })
        newRed.push({ index: idx, value: sample.red })
        idx++
      }
      updates.ppgIr = [...state.ppgIr, ...newIr].slice(-PPG_BUFFER_SIZE)
      updates.ppgRed = [...state.ppgRed, ...newRed].slice(-PPG_BUFFER_SIZE)
      updates.ppgSampleIndex = idx
    }

    // PPG Analysis
    if (payload.ppgAnalysis) {
      const p = payload.ppgAnalysis
      updates.ppgAnalysis = {
        bpm: p.bpm ?? 0,
        spo2: (p.spo2 as number) ?? null,
        sdnn: p.sdnn as number | undefined,
        rmssd: p.rmssd as number | undefined,
        pnn50: p.pnn50 as number | undefined,
        stressIndex: p.stressIndex as number | undefined,
        lfHfRatio: p.lfHfRatio as number | undefined,
      }

      const hIdx = state.ppgHistoryIndex + 1
      updates.ppgHistoryIndex = hIdx

      if (p.bpm > 0) {
        updates.bpmHistory = [...state.bpmHistory, { index: hIdx, value: p.bpm }].slice(-HISTORY_SIZE)
      }
      if (p.spo2 != null) {
        updates.spo2History = [...state.spo2History, { index: hIdx, value: p.spo2 }].slice(-HISTORY_SIZE)
      }
    }

    // ACC Raw
    if (payload.accRaw && payload.accRaw.length > 0) {
      let idx = state.accSampleIndex
      const newX: DataPoint[] = []
      const newY: DataPoint[] = []
      const newZ: DataPoint[] = []
      const newMag: DataPoint[] = []
      for (const sample of payload.accRaw) {
        newX.push({ index: idx, value: sample.x })
        newY.push({ index: idx, value: sample.y })
        newZ.push({ index: idx, value: sample.z })
        newMag.push({ index: idx, value: sample.magnitude ?? Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2) })
        idx++
      }
      updates.accX = [...state.accX, ...newX].slice(-ACC_BUFFER_SIZE)
      updates.accY = [...state.accY, ...newY].slice(-ACC_BUFFER_SIZE)
      updates.accZ = [...state.accZ, ...newZ].slice(-ACC_BUFFER_SIZE)
      updates.accMagnitude = [...state.accMagnitude, ...newMag].slice(-ACC_BUFFER_SIZE)
      updates.accSampleIndex = idx
    }

    // ACC Analysis
    if (payload.accAnalysis) {
      const acc = payload.accAnalysis
      updates.accAnalysis = {
        activityState: acc.activityState as string,
        intensity: acc.intensity as number,
        stability: acc.stability as number,
        avgMovement: acc.avgMovement as number,
        maxMovement: acc.maxMovement as number,
      }
    }

    // Battery
    if (payload.battery) {
      updates.batteryLevel = payload.battery.level
    }

    return updates
  }),

  resetData: () => set({
    eegFp1: [], eegFp2: [], eegSignalQuality: [], eegAnalysis: null, eegSampleIndex: 0,
    ppgIr: [], ppgRed: [], ppgAnalysis: null, bpmHistory: [], spo2History: [], ppgSampleIndex: 0, ppgHistoryIndex: 0,
    accX: [], accY: [], accZ: [], accMagnitude: [], accSampleIndex: 0, accAnalysis: null,
    batteryLevel: null, messageCount: 0,
  }),
}))
