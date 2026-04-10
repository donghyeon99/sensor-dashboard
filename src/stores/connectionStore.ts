import { create } from 'zustand'

interface ConnectionState {
  url: string
  connected: boolean
  isMock: boolean
  error: string | null
  eventSource: EventSource | null
  setUrl: (url: string) => void
  setConnected: (connected: boolean) => void
  setIsMock: (isMock: boolean) => void
  setError: (error: string | null) => void
  setEventSource: (es: EventSource | null) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  url: '',
  connected: false,
  isMock: false,
  error: null,
  eventSource: null,
  setUrl: (url) => set({ url }),
  setConnected: (connected) => set({ connected, error: connected ? null : undefined }),
  setIsMock: (isMock) => set({ isMock }),
  setError: (error) => set({ error }),
  setEventSource: (eventSource) => set({ eventSource }),
  reset: () => set({ url: '', connected: false, isMock: false, error: null, eventSource: null }),
}))
