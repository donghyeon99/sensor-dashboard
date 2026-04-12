// Design Ref: §3.5 — "Waiting for data..." / "Press Connect" pattern extracted
import { useConnectionStore } from '../../stores/connectionStore'

interface WaitingStateProps {
  icon: string
  label: string
  className?: string
}

export function WaitingState({ icon, label, className = 'py-8' }: WaitingStateProps) {
  const connected = useConnectionStore((s) => s.connected)
  return (
    <div className={`text-center ${className}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-sm text-text-secondary">
        {connected ? `Waiting for ${label} data...` : 'Press the Connect button to connect'}
      </div>
    </div>
  )
}
