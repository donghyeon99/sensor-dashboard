// Design Ref: §3.3 — battery slice
import { create } from 'zustand'

interface BatteryState {
  level: number | null
  setLevel: (level: number) => void
  reset: () => void
}

export const useBatteryStore = create<BatteryState>((set) => ({
  level: null,
  setLevel: (level) => set({ level }),
  reset: () => set({ level: null }),
}))
