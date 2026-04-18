// Design Ref: §3.3 — stats slice (message count for Footer)
import { create } from 'zustand'

interface StatsState {
  messageCount: number
  increment: () => void
  incrementBy: (n: number) => void
  reset: () => void
}

export const useStatsStore = create<StatsState>((set) => ({
  messageCount: 0,
  increment: () => set((s) => ({ messageCount: s.messageCount + 1 })),
  incrementBy: (n) => set((s) => ({ messageCount: s.messageCount + n })),
  reset: () => set({ messageCount: 0 }),
}))
