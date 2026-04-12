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
import type { SSEMessage, SensorPayload } from '../types/sensor'

function dispatchPayload(payload: SensorPayload) {
  useStatsStore.getState().increment()

  if (payload.eegRaw && payload.eegRaw.length > 0) {
    useEegStore.getState().ingestRaw(payload.eegRaw)
  }
  if (payload.eegAnalysis) {
    useEegStore.getState().ingestAnalysis(payload.eegAnalysis as Record<string, unknown>)
  }

  if (payload.ppgRaw && payload.ppgRaw.length > 0) {
    usePpgStore.getState().ingestRaw(payload.ppgRaw)
  }
  if (payload.ppgAnalysis) {
    usePpgStore.getState().ingestAnalysis(payload.ppgAnalysis as Record<string, unknown>)
  }

  if (payload.accRaw && payload.accRaw.length > 0) {
    useAccStore.getState().ingestRaw(payload.accRaw)
  }
  if (payload.accAnalysis) {
    useAccStore.getState().ingestAnalysis(payload.accAnalysis as Record<string, unknown>)
  }

  if (payload.battery) {
    useBatteryStore.getState().setLevel(payload.battery.level)
  }
}

function resetAllSlices() {
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
