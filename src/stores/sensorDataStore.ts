import { create } from 'zustand'
import type { EegAnalysis, PpgAnalysis, AccAnalysis, DataPoint, SensorPayload } from '../types/sensor'

const EEG_BUFFER_SIZE = 1000  // ~4 seconds at 250Hz
const PPG_BUFFER_SIZE = 200   // ~4 seconds at 50Hz
const ACC_BUFFER_SIZE = 100   // ~4 seconds at 25Hz
const HISTORY_SIZE = 120      // ~2 minutes of analysis updates

const EEG_SAMPLE_RATE = 250
const EEG_TRANSIENT_SAMPLES = 250
const BUTTERWORTH_Q = 1 / Math.SQRT2

const NOTCH_F0 = 60
const NOTCH_Q = 30
const NOTCH_W0 = 2 * Math.PI * NOTCH_F0 / EEG_SAMPLE_RATE
const NOTCH_COS = Math.cos(NOTCH_W0)
const NOTCH_ALPHA_RBJ = Math.sin(NOTCH_W0) / (2 * NOTCH_Q)
const NOTCH_A0 = 1 + NOTCH_ALPHA_RBJ
const NOTCH_B0 = 1 / NOTCH_A0
const NOTCH_B1 = (-2 * NOTCH_COS) / NOTCH_A0
const NOTCH_B2 = 1 / NOTCH_A0
const NOTCH_A1 = (-2 * NOTCH_COS) / NOTCH_A0
const NOTCH_A2 = (1 - NOTCH_ALPHA_RBJ) / NOTCH_A0

const HP_F0 = 1
const HP_W0 = 2 * Math.PI * HP_F0 / EEG_SAMPLE_RATE
const HP_COS = Math.cos(HP_W0)
const HP_ALPHA_RBJ = Math.sin(HP_W0) / (2 * BUTTERWORTH_Q)
const HP_A0 = 1 + HP_ALPHA_RBJ
const HP_B0 = ((1 + HP_COS) / 2) / HP_A0
const HP_B1 = (-(1 + HP_COS)) / HP_A0
const HP_B2 = ((1 + HP_COS) / 2) / HP_A0
const HP_A1 = (-2 * HP_COS) / HP_A0
const HP_A2 = (1 - HP_ALPHA_RBJ) / HP_A0

const LP_F0 = 45
const LP_W0 = 2 * Math.PI * LP_F0 / EEG_SAMPLE_RATE
const LP_COS = Math.cos(LP_W0)
const LP_ALPHA_RBJ = Math.sin(LP_W0) / (2 * BUTTERWORTH_Q)
const LP_A0 = 1 + LP_ALPHA_RBJ
const LP_B0 = ((1 - LP_COS) / 2) / LP_A0
const LP_B1 = (1 - LP_COS) / LP_A0
const LP_B2 = ((1 - LP_COS) / 2) / LP_A0
const LP_A1 = (-2 * LP_COS) / LP_A0
const LP_A2 = (1 - LP_ALPHA_RBJ) / LP_A0

interface EEGChannelFilterState {
  nX1: number; nX2: number; nY1: number; nY2: number
  hX1: number; hX2: number; hY1: number; hY2: number
  lX1: number; lX2: number; lY1: number; lY2: number
  samplesProcessed: number
}

const createFilterState = (): EEGChannelFilterState => ({
  nX1: 0, nX2: 0, nY1: 0, nY2: 0,
  hX1: 0, hX2: 0, hY1: 0, hY2: 0,
  lX1: 0, lX2: 0, lY1: 0, lY2: 0,
  samplesProcessed: 0,
})

interface SensorDataState {
  // EEG
  eegFp1: DataPoint[]
  eegFp2: DataPoint[]
  eegSignalQuality: DataPoint[]
  eegAnalysis: EegAnalysis | null
  eegSampleIndex: number
  eegFp1Filter: EEGChannelFilterState
  eegFp2Filter: EEGChannelFilterState
  eegRawLeadOff: { ch1: boolean; ch2: boolean }

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
  eegFp1Filter: createFilterState(),
  eegFp2Filter: createFilterState(),
  eegRawLeadOff: { ch1: false, ch2: false },

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
      const fp1State: EEGChannelFilterState = { ...state.eegFp1Filter }
      const fp2State: EEGChannelFilterState = { ...state.eegFp2Filter }
      const newFp1: DataPoint[] = []
      const newFp2: DataPoint[] = []
      const newSQ: DataPoint[] = []
      for (const sample of payload.eegRaw) {
        const x1_0 = sample.fp1
        const yN1 = NOTCH_B0 * x1_0 + NOTCH_B1 * fp1State.nX1 + NOTCH_B2 * fp1State.nX2 - NOTCH_A1 * fp1State.nY1 - NOTCH_A2 * fp1State.nY2
        fp1State.nX2 = fp1State.nX1; fp1State.nX1 = x1_0
        fp1State.nY2 = fp1State.nY1; fp1State.nY1 = yN1
        const yH1 = HP_B0 * yN1 + HP_B1 * fp1State.hX1 + HP_B2 * fp1State.hX2 - HP_A1 * fp1State.hY1 - HP_A2 * fp1State.hY2
        fp1State.hX2 = fp1State.hX1; fp1State.hX1 = yN1
        fp1State.hY2 = fp1State.hY1; fp1State.hY1 = yH1
        const yL1 = LP_B0 * yH1 + LP_B1 * fp1State.lX1 + LP_B2 * fp1State.lX2 - LP_A1 * fp1State.lY1 - LP_A2 * fp1State.lY2
        fp1State.lX2 = fp1State.lX1; fp1State.lX1 = yH1
        fp1State.lY2 = fp1State.lY1; fp1State.lY1 = yL1
        const out1 = fp1State.samplesProcessed < EEG_TRANSIENT_SAMPLES ? 0 : yL1
        fp1State.samplesProcessed++
        newFp1.push({ index: idx, value: out1 })

        const x2_0 = sample.fp2
        const yN2 = NOTCH_B0 * x2_0 + NOTCH_B1 * fp2State.nX1 + NOTCH_B2 * fp2State.nX2 - NOTCH_A1 * fp2State.nY1 - NOTCH_A2 * fp2State.nY2
        fp2State.nX2 = fp2State.nX1; fp2State.nX1 = x2_0
        fp2State.nY2 = fp2State.nY1; fp2State.nY1 = yN2
        const yH2 = HP_B0 * yN2 + HP_B1 * fp2State.hX1 + HP_B2 * fp2State.hX2 - HP_A1 * fp2State.hY1 - HP_A2 * fp2State.hY2
        fp2State.hX2 = fp2State.hX1; fp2State.hX1 = yN2
        fp2State.hY2 = fp2State.hY1; fp2State.hY1 = yH2
        const yL2 = LP_B0 * yH2 + LP_B1 * fp2State.lX1 + LP_B2 * fp2State.lX2 - LP_A1 * fp2State.lY1 - LP_A2 * fp2State.lY2
        fp2State.lX2 = fp2State.lX1; fp2State.lX1 = yH2
        fp2State.lY2 = fp2State.lY1; fp2State.lY1 = yL2
        const out2 = fp2State.samplesProcessed < EEG_TRANSIENT_SAMPLES ? 0 : yL2
        fp2State.samplesProcessed++
        newFp2.push({ index: idx, value: out2 })

        // signalQuality: 0 = best, higher = worse → invert to 0-100% (100 = best)
        const sqValue = Math.max(0, 100 - (sample.signalQuality ?? 0))
        newSQ.push({ index: idx, value: sqValue })
        idx++
      }
      const lastSample = payload.eegRaw[payload.eegRaw.length - 1]
      updates.eegFp1 = [...state.eegFp1, ...newFp1].slice(-EEG_BUFFER_SIZE)
      updates.eegFp2 = [...state.eegFp2, ...newFp2].slice(-EEG_BUFFER_SIZE)
      updates.eegSignalQuality = [...state.eegSignalQuality, ...newSQ].slice(-EEG_BUFFER_SIZE)
      updates.eegSampleIndex = idx
      updates.eegFp1Filter = fp1State
      updates.eegFp2Filter = fp2State
      updates.eegRawLeadOff = {
        ch1: Boolean(lastSample.leadOff?.ch1),
        ch2: Boolean(lastSample.leadOff?.ch2),
      }
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
        emotionalStability: (a.emotionalStability as number) ?? 0,
        hemisphericBalance: (a.hemisphericBalance as number) ?? 0,
        attentionLevel: a.attentionLevel as number | undefined,
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
    eegFp1Filter: createFilterState(), eegFp2Filter: createFilterState(), eegRawLeadOff: { ch1: false, ch2: false },
    ppgIr: [], ppgRed: [], ppgAnalysis: null, bpmHistory: [], spo2History: [], ppgSampleIndex: 0, ppgHistoryIndex: 0,
    accX: [], accY: [], accZ: [], accMagnitude: [], accSampleIndex: 0, accAnalysis: null,
    batteryLevel: null, messageCount: 0,
  }),
}))
