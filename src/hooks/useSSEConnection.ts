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

const EEG_SR = 250
const PPG_SR = 50
const ACC_SR = 25

// Playback buffer — hold ~1 second of samples so the chart keeps ticking at a
// perfectly steady rate even when SSE packets arrive late or bursty (~1s of network
// jitter is absorbed). Adds ~1s display latency in exchange for timer-smooth motion.
const EEG_TARGET_BUF = EEG_SR        // 1.0s
const PPG_TARGET_BUF = PPG_SR        // 1.0s
const ACC_TARGET_BUF = ACC_SR        // 1.0s

// Hard cap to avoid runaway growth if frames stall (e.g., tab backgrounded).
const EEG_MAX_BUF = EEG_SR * 4   // 4s worth
const PPG_MAX_BUF = PPG_SR * 4
const ACC_MAX_BUF = ACC_SR * 4

// Don't start playback until we've buffered this much — prevents initial stutter.
const PREBUFFER_RATIO = 0.5  // wait for half the target before draining

const eegQueue: EegRawSample[] = []
const ppgQueue: PpgRawSample[] = []
const accQueue: AccSample[] = []

// Per-stream playback state. `acc` is fractional sample carry; `primed` is true
// once we've buffered enough to start steady playback (false during initial fill
// or after underrun).
const eegState = { acc: 0, primed: false }
const ppgState = { acc: 0, primed: false }
const accState = { acc: 0, primed: false }

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
  state: { acc: number; primed: boolean },
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
  const drain = Math.min(queue.length, Math.floor(state.acc))
  if (drain <= 0) return []
  state.acc -= drain

  // If queue is somehow draining to empty (shouldn't happen with healthy SSE), drop
  // priming so next batch re-buffers — avoids one-sample-at-a-time stutter.
  if (queue.length === drain) state.primed = false

  return queue.splice(0, drain)
}

function frameLoop(now: number) {
  const elapsedMs = lastFrameTs === 0 ? 16 : Math.min(100, now - lastFrameTs)
  lastFrameTs = now

  const eegBatch = drainQueue(eegQueue, elapsedMs, EEG_SR, EEG_TARGET_BUF, EEG_MAX_BUF, eegState)
  const ppgBatch = drainQueue(ppgQueue, elapsedMs, PPG_SR, PPG_TARGET_BUF, PPG_MAX_BUF, ppgState)
  const accBatch = drainQueue(accQueue, elapsedMs, ACC_SR, ACC_TARGET_BUF, ACC_MAX_BUF, accState)

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

  // Keep looping while we have queued samples or any work pending.
  if (
    eegQueue.length > 0 ||
    ppgQueue.length > 0 ||
    accQueue.length > 0 ||
    im.msgCount > 0
  ) {
    rafId = requestAnimationFrame(frameLoop)
  } else {
    rafId = null
  }
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
  eegState.acc = 0; eegState.primed = false
  ppgState.acc = 0; ppgState.primed = false
  accState.acc = 0; accState.primed = false
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
