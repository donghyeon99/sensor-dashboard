import { useCallback } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import { useSensorDataStore } from '../stores/sensorDataStore'
import type { SSEMessage } from '../types/sensor'

export function useSSEConnection() {
  const { connected, isMock, url, error, setUrl, setConnected, setIsMock, setError, setEventSource, reset } = useConnectionStore()
  const { updateFromPayload, resetData } = useSensorDataStore()
  const messageCount = useSensorDataStore((s) => s.messageCount)

  const connect = useCallback((sseUrl: string) => {
    const existing = useConnectionStore.getState().eventSource
    if (existing) existing.close()

    resetData()
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
        if (data.payload) updateFromPayload(data.payload)
      }

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setConnected(false)
          setError('Connection lost. Please check the URL.')
        }
      }
    } catch (err) {
      setConnected(false)
      setError('Invalid URL. Please check the SSE URL.')
    }
  }, [resetData, setUrl, setIsMock, setError, setEventSource, setConnected, updateFromPayload])

  const disconnect = useCallback(() => {
    const es = useConnectionStore.getState().eventSource
    if (es) es.close()
    reset()
    resetData()
  }, [reset, resetData])

  return { connected, isMock, url, error, messageCount, connect, disconnect }
}
