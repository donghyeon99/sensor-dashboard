import { useRef, useState, useEffect } from 'react'
import { useStatsStore } from '../../stores/slices/statsStore'
import { useConnectionStore } from '../../stores/connectionStore'

export function Footer() {
  const messageCount = useStatsStore((s) => s.messageCount)
  const connected = useConnectionStore((s) => s.connected)
  const isMock = useConnectionStore((s) => s.isMock)
  const prevCount = useRef(messageCount)
  const [dataRate, setDataRate] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const current = useStatsStore.getState().messageCount
      setDataRate(current - prevCount.current)
      prevCount.current = current
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const statusLabel = connected ? (isMock ? 'Mock' : 'Live') : 'Offline'
  const statusColor = connected
    ? isMock ? 'text-yellow' : 'text-teal'
    : 'text-coral'

  return (
    <footer className="px-7 py-3 border-t border-border flex items-center justify-between bg-bg-card/60">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <span>Messages</span>
          <span className="text-text-secondary font-semibold">{messageCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <span>Rate</span>
          <span className="text-text-secondary font-semibold">{dataRate} msg/s</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <span>Status</span>
          <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>
      <div className="text-[11px] text-text-muted tracking-wide">
        LuxAcademy BCI v2.0
      </div>
    </footer>
  )
}
