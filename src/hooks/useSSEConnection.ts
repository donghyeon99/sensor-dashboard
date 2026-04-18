// Design Ref: §3.3 — dispatches SSE payload to domain-specific store slices
import { useCallback } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import {
  useAccStore,
  useBatteryStore,
  useEegStore,
  usePpgStore,
  useStatsStore,
} from '../stores/slices'
import type {
  AccSample,
  EegAnalysis,
  EegRawSample,
  PpgAnalysis,
  PpgRawSample,
  SSEMessage,
  SensorPayload,
} from '../types/sensor'

// ─── Frame-paced sample drainer ──────────────────────────────────────────────
// SSE delivers samples in irregular bursts (e.g., 14 samples every ~280ms for PPG).
// Without pacing, the chart jumps when a packet arrives and freezes between packets,
// producing a "fast/slow/fast/slow" look that doesn't reflect the actual constant
// sample rate of the device. The drainer queues incoming samples and releases them
// to the stores at the natural sensor rate, smoothed across animation frames.
//
// Strategy: per-stream FIFO queue + adaptive drain.
//   - Base drain: ceil(sampleRate * elapsedMs / 1000) samples per frame.
//   - Catch-up: if queue grows beyond TARGET_BUFFER, drain extra to keep latency bounded.
//   - Underrun: if queue is empty, simply emit nothing (chart pauses briefly until
//     next packet arrives). The UI can't smooth past actual silence.
//
// Analysis events (eeg/ppg/acc analysis) and battery flush immediately each frame
// — they're low-rate and don't need pacing.

// Sample rates — match nominal device rates. SSE arrival jitter is absorbed by
// the playback buffer below, so these don't need to track instantaneous rate.
const EEG_SR = 250
const PPG_SR = 50
const ACC_SR = 30  // linkband ACC is 30Hz (samples are 33.3ms apart within a packet)

// Playback buffer sizes — sized to absorb the max observed SSE inter-packet gap
// for each stream. Live capture showed PPG max gap ~1.7s and ACC max gap ~3s,
// so larger buffers for those (extra display latency vs. constant flow trade-off).
const EEG_TARGET_BUF = EEG_SR          // 1.0s
const PPG_TARGET_BUF = Math.round(PPG_SR * 1.5)  // 1.5s — covers most PPG gaps
const ACC_TARGET_BUF = ACC_SR * 2      // 2.0s — ACC bursts are very lumpy

// Hard cap to avoid runaway growth if frames stall (e.g., tab backgrounded).
const EEG_MAX_BUF = EEG_SR * 6   // 6s worth (EEG arrives 13% faster than nominal)
const PPG_MAX_BUF = PPG_SR * 4
const ACC_MAX_BUF = ACC_SR * 5

// Don't start playback until we've buffered this much — prevents initial stutter.
// Lower = faster initial display, higher = more jitter tolerance.
const PREBUFFER_RATIO = 0.2  // wait for 20% of target (~200ms of data) before draining

const eegQueue: EegRawSample[] = []
const ppgQueue: PpgRawSample[] = []
const accQueue: AccSample[] = []

// Per-stream playback state.
//   acc:        fractional sample carry (controls drain rate)
//   primed:     true once we've buffered enough to start steady playback
//   lastSample: last sample drained — used to "hold" the line during brief SSE
//               gaps so the chart keeps scrolling at constant rate rather than
//               freezing. Capped at HOLD_MAX_MS so true silence is still visible.
//   heldSinceMs: timestamp when we started holding (no real samples since)
type DrainState<T> = { acc: number; primed: boolean; lastSample: T | null; heldSinceMs: number }
const eegState: DrainState<EegRawSample> = { acc: 0, primed: false, lastSample: null, heldSinceMs: 0 }
const ppgState: DrainState<PpgRawSample> = { acc: 0, primed: false, lastSample: null, heldSinceMs: 0 }
const accState: DrainState<AccSample> = { acc: 0, primed: false, lastSample: null, heldSinceMs: 0 }

// Up to 800ms of held samples before we let the chart pause. Captured live data
// showed inter-packet gaps up to 1.7s for PPG and 3s for ACC; 800ms covers most
// while keeping fake (held) data short enough not to mislead.
const HOLD_MAX_MS = 800

type ImmediatePending = {
  eegAnalysis: (EegAnalysis & Record<string, unknown>) | null
  ppgAnalysis: (PpgAnalysis & Record<string, unknown>) | null
  accAnalysis: Record<string, unknown> | null
  battery: number | null
  msgCount: number
}

let immediatePending: ImmediatePending = {
  eegAnalysis: null,
  ppgAnalysis: null,
  accAnalysis: null,
  battery: null,
  msgCount: 0,
}

let rafId: number | null = null
let lastFrameTs = 0

function drainQueue<T>(
  queue: T[],
  elapsedMs: number,
  sr: number,
  target: number,
  maxBuf: number,
  state: DrainState<T>,
  nowMs: number,
): T[] {
  // Cap runaway growth (tab backgrounded for a long time, etc.)
  if (queue.length > maxBuf) {
    queue.splice(0, queue.length - maxBuf)
  }

  // Pre-buffer phase: wait until we've collected enough to absorb jitter without
  // ever underrunning. Once primed, we play steadily at exactly `sr` samples/sec.
  if (!state.primed) {
    if (queue.length < target * PREBUFFER_RATIO) return []
    state.primed = true
    state.acc = 0
  }

  // Strict constant rate — no catch-up, no overshoot acceleration. The timer ticks.
  state.acc += (sr * elapsedMs) / 1000
  // Cap accumulator to bound post-silence burst. Floor of at least 2 ensures
  // floor(acc) >= 1 is reachable for low-rate streams (e.g., ACC at 30Hz where
  // 33ms × 30 = 0.99 < 1 would mean drain stays 0 forever). Long backgrounded
  // tab idles are still handled by IDLE_RESYNC in frameLoop.
  const ACC_CAP = Math.max(2, (sr * 50) / 1000)
  if (state.acc > ACC_CAP) state.acc = ACC_CAP
  const wantDrain = Math.floor(state.acc)
  if (wantDrain <= 0) return []

  // Hold-last-sample: if SSE is briefly silent (queue empty or short), repeat the
  // last drained sample so the chart keeps scrolling at constant rate instead of
  // visibly pausing every inter-packet gap. Capped at HOLD_MAX_MS so a real long
  // silence still freezes the chart honestly (no fake data flowing forever).
  if (queue.length >= wantDrain) {
    state.acc -= wantDrain
    state.heldSinceMs = 0
    const out = queue.splice(0, wantDrain)
    state.lastSample = out[out.length - 1]
    return out
  }

  // Drain whatever we have, then synthesize the rest with the held value (if any)
  state.acc -= wantDrain
  const realCount = queue.length
  const synthCount = wantDrain - realCount
  const out: T[] = realCount > 0 ? queue.splice(0, realCount) : []
  if (realCount > 0) {
    state.lastSample = out[out.length - 1]
    state.heldSinceMs = 0
  }
  if (synthCount > 0 && state.lastSample !== null) {
    if (state.heldSinceMs === 0) state.heldSinceMs = nowMs
    if (nowMs - state.heldSinceMs <= HOLD_MAX_MS) {
      // Shallow clone the last sample so downstream mutations don't surprise us
      const held = state.lastSample
      for (let i = 0; i < synthCount; i++) out.push({ ...held } as T)
    }
  }
  return out
}

// If a frame gap exceeds this, we treat it as "tab was hidden / long idle":
// drop older queued samples so the chart catches up to "now" instead of
// burst-drawing a backlog or running with multi-second display latency.
const IDLE_RESYNC_MS = 200

function frameLoop(now: number) {
  const rawElapsed = lastFrameTs === 0 ? 16 : now - lastFrameTs
  const elapsedMs = lastFrameTs === 0 ? 16 : Math.min(100, rawElapsed)
  lastFrameTs = now

  // Long gap → resync: keep only ~target samples (recent) and reset accumulators.
  // Frame loop wasn't running (rAF paused while tab hidden), so the queue may have
  // grown by seconds of data that's no longer worth catching up to.
  if (rawElapsed > IDLE_RESYNC_MS) {
    if (eegQueue.length > EEG_TARGET_BUF) eegQueue.splice(0, eegQueue.length - EEG_TARGET_BUF)
    if (ppgQueue.length > PPG_TARGET_BUF) ppgQueue.splice(0, ppgQueue.length - PPG_TARGET_BUF)
    if (accQueue.length > ACC_TARGET_BUF) accQueue.splice(0, accQueue.length - ACC_TARGET_BUF)
    eegState.acc = 0
    ppgState.acc = 0
    accState.acc = 0
  }

  const eegBatch = drainQueue(eegQueue, elapsedMs, EEG_SR, EEG_TARGET_BUF, EEG_MAX_BUF, eegState, now)
  const ppgBatch = drainQueue(ppgQueue, elapsedMs, PPG_SR, PPG_TARGET_BUF, PPG_MAX_BUF, ppgState, now)
  const accBatch = drainQueue(accQueue, elapsedMs, ACC_SR, ACC_TARGET_BUF, ACC_MAX_BUF, accState, now)

  if (eegBatch.length > 0) useEegStore.getState().ingestRaw(eegBatch)
  if (ppgBatch.length > 0) usePpgStore.getState().ingestRaw(ppgBatch)
  if (accBatch.length > 0) useAccStore.getState().ingestRaw(accBatch)

  const im = immediatePending
  if (im.msgCount > 0) {
    useStatsStore.getState().incrementBy(im.msgCount)
    im.msgCount = 0
  }
  if (im.eegAnalysis) {
    useEegStore.getState().ingestAnalysis(im.eegAnalysis)
    im.eegAnalysis = null
  }
  if (im.ppgAnalysis) {
    usePpgStore.getState().ingestAnalysis(im.ppgAnalysis)
    im.ppgAnalysis = null
  }
  if (im.accAnalysis) {
    useAccStore.getState().ingestAnalysis(im.accAnalysis)
    im.accAnalysis = null
  }
  if (im.battery !== null) {
    useBatteryStore.getState().setLevel(im.battery)
    im.battery = null
  }

  // Keep the frame loop running as long as we're connected. Stopping when queues
  // empty briefly caused a stutter every inter-packet gap: stop → SSE arrives →
  // ensureFrameLoop restarts → first frame's elapsed = packet gap (~280ms) →
  // IDLE_RESYNC fired → acc reset → drain=0 frame → visible "뚝". Now we just keep
  // ticking; idle frames cost ~µs and the loop is paused naturally only on
  // disconnect/reset (which clears rafId).
  rafId = requestAnimationFrame(frameLoop)
}

function ensureFrameLoop() {
  if (rafId !== null) return
  if (typeof requestAnimationFrame === 'undefined') {
    setTimeout(() => frameLoop(performance.now()), 16)
    return
  }
  rafId = requestAnimationFrame(frameLoop)
}

function dispatchPayload(payload: SensorPayload) {
  immediatePending.msgCount++

  if (payload.eegRaw && payload.eegRaw.length > 0) {
    for (let i = 0; i < payload.eegRaw.length; i++) eegQueue.push(payload.eegRaw[i])
  }
  if (payload.eegAnalysis) immediatePending.eegAnalysis = payload.eegAnalysis

  if (payload.ppgRaw && payload.ppgRaw.length > 0) {
    for (let i = 0; i < payload.ppgRaw.length; i++) ppgQueue.push(payload.ppgRaw[i])
  }
  if (payload.ppgAnalysis) immediatePending.ppgAnalysis = payload.ppgAnalysis

  if (payload.accRaw && payload.accRaw.length > 0) {
    for (let i = 0; i < payload.accRaw.length; i++) accQueue.push(payload.accRaw[i])
  }
  if (payload.accAnalysis) immediatePending.accAnalysis = payload.accAnalysis

  if (payload.battery) immediatePending.battery = payload.battery.level

  ensureFrameLoop()
}

// During Vite HMR, this module gets re-evaluated when its deps change. The live
// EventSource (held in connectionStore) keeps its onmessage closure pointing at
// the OLD module's dispatchPayload → samples flow into orphaned queues, charts
// freeze. On dispose we close the EventSource so the next mount creates a fresh
// one wired to the new module instance.
const hot = (import.meta as ImportMeta & { hot?: { dispose: (cb: () => void) => void } }).hot
if (hot) {
  hot.dispose(() => {
    const es = useConnectionStore.getState().eventSource
    if (es) es.close()
    useConnectionStore.getState().reset()
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  })
}

function resetAllSlices() {
  eegQueue.length = 0
  ppgQueue.length = 0
  accQueue.length = 0
  immediatePending = {
    eegAnalysis: null,
    ppgAnalysis: null,
    accAnalysis: null,
    battery: null,
    msgCount: 0,
  }
  lastFrameTs = 0
  eegState.acc = 0; eegState.primed = false; eegState.lastSample = null; eegState.heldSinceMs = 0
  ppgState.acc = 0; ppgState.primed = false; ppgState.lastSample = null; ppgState.heldSinceMs = 0
  accState.acc = 0; accState.primed = false; accState.lastSample = null; accState.heldSinceMs = 0
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  useEegStore.getState().reset()
  usePpgStore.getState().reset()
  useAccStore.getState().reset()
  useBatteryStore.getState().reset()
  useStatsStore.getState().reset()
}

export function useSSEConnection() {
  const {
    connected,
    isMock,
    url,
    error,
    setUrl,
    setConnected,
    setIsMock,
    setError,
    setEventSource,
    reset: resetConnection,
  } = useConnectionStore()
  const messageCount = useStatsStore((s) => s.messageCount)

  const connect = useCallback(
    (sseUrl: string) => {
      const existing = useConnectionStore.getState().eventSource
      if (existing) existing.close()

      resetAllSlices()
      setUrl(sseUrl)
      setIsMock(sseUrl.includes('mock'))
      setError(null)

      try {
        const es = new EventSource(sseUrl.replace(/\+/g, '%2B'))
        setEventSource(es)

        es.onopen = () => {
          setConnected(true)
          setError(null)
        }

        es.onmessage = (event) => {
          const data: SSEMessage = JSON.parse(event.data)
          if (!useConnectionStore.getState().connected) {
            setConnected(true)
            setError(null)
          }
          if (data.type === 'connected') return

          if (data.payload) dispatchPayload(data.payload)
        }

        es.onerror = () => {
          if (es.readyState === EventSource.CLOSED) {
            setConnected(false)
            setError('Connection lost. Please check the URL.')
          }
        }
      } catch {
        setConnected(false)
        setError('Invalid URL. Please check the SSE URL.')
      }
    },
    [setUrl, setIsMock, setError, setEventSource, setConnected],
  )

  const disconnect = useCallback(() => {
    const es = useConnectionStore.getState().eventSource
    if (es) es.close()
    resetConnection()
    resetAllSlices()
  }, [resetConnection])

  return { connected, isMock, url, error, messageCount, connect, disconnect }
}
