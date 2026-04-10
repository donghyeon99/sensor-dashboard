import { useCallback } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import { useSensorDataStore } from '../stores/sensorDataStore'
import type { SSEMessage } from '../types/sensor'

export function useSSEConnection() {
  const { connected, isMock, url, setUrl, setConnected, setIsMock, setEventSource, reset } = useConnectionStore()
  const { updateFromPayload, resetData } = useSensorDataStore()
  const messageCount = useSensorDataStore((s) => s.messageCount)

  const connect = useCallback((sseUrl: string) => {
    console.log('🔌 Connecting to:', sseUrl)

    // Close existing connection
    const existing = useConnectionStore.getState().eventSource
    if (existing) {
      console.log('🔌 Closing existing connection')
      existing.close()
    }

    resetData()
    setUrl(sseUrl)
    setIsMock(sseUrl.includes('mock'))
    setConnected(true) // Set connected immediately on user action

    try {
      const es = new EventSource(sseUrl)
      setEventSource(es)

      es.onopen = () => {
        console.log('✅ SSE onopen fired')
        setConnected(true)
      }

      es.onmessage = (event) => {
        const data: SSEMessage = JSON.parse(event.data)

        // Ensure connected state on any message
        if (!useConnectionStore.getState().connected) {
          setConnected(true)
        }

        // Skip connection confirmation message
        if (data.type === 'connected') {
          console.log('✅ SSE server confirmed:', data.subscribers, 'subscribers')
          return
        }

        if (data.payload) {
          updateFromPayload(data.payload)
        }
      }

      es.onerror = (e) => {
        console.warn('⚠️ SSE error:', e)
        if (es.readyState === EventSource.CLOSED) {
          console.error('❌ SSE connection closed')
          setConnected(false)
        }
      }
    } catch (err) {
      console.error('❌ Failed to create EventSource:', err)
      setConnected(false)
    }
  }, [resetData, setUrl, setIsMock, setEventSource, setConnected, updateFromPayload])

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting')
    const es = useConnectionStore.getState().eventSource
    if (es) {
      es.close()
    }
    reset()
    resetData()
  }, [reset, resetData])

  return { connected, isMock, url, messageCount, connect, disconnect }
}
