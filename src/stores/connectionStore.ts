import { create } from 'zustand'

interface ConnectionState {
  url: string
  connected: boolean
  isMock: boolean
  eventSource: EventSource | null
  setUrl: (url: string) => void
  setConnected: (connected: boolean) => void
  setIsMock: (isMock: boolean) => void
  setEventSource: (es: EventSource | null) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  url: '',
  connected: false,
  isMock: false,
  eventSource: null,
  setUrl: (url) => set({ url }),
  setConnected: (connected) => set({ connected }),
  setIsMock: (isMock) => set({ isMock }),
  setEventSource: (eventSource) => set({ eventSource }),
  reset: () => set({ url: '', connected: false, isMock: false, eventSource: null }),
}))
