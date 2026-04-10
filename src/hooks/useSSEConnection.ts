import { useCallback } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import { useSensorDataStore } from '../stores/sensorDataStore'
import type { SSEMessage } from '../types/sensor'

export function useSSEConnection() {
  const { connected, isMock, url, setUrl, setConnected, setIsMock, setEventSource, reset } = useConnectionStore()
  const { updateFromPayload, resetData } = useSensorDataStore()
  const messageCount = useSensorDataStore((s) => s.messageCount)

  const connect = useCallback((sseUrl: string) => {
    // Close existing connection
    const existing = useConnectionStore.getState().eventSource
    if (existing) {
      existing.close()
    }

    resetData()
    setUrl(sseUrl)
    setIsMock(sseUrl.includes('mock'))

    const es = new EventSource(sseUrl)
    setEventSource(es)

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      const data: SSEMessage = JSON.parse(event.data)

      // Skip connection confirmation message
      if (data.type === 'connected') return

      if (data.payload) {
        updateFromPayload(data.payload)
      }
    }

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects
    }
  }, [resetData, setUrl, setIsMock, setEventSource, setConnected, updateFromPayload])

  const disconnect = useCallback(() => {
    const es = useConnectionStore.getState().eventSource
    if (es) {
      es.close()
    }
    reset()
    resetData()
  }, [reset, resetData])

  return { connected, isMock, url, messageCount, connect, disconnect }
}
