import { useConnectionStore } from '../../stores/connectionStore'

interface Props {
  icon: string
  label: string
}

export function EmptyState({ icon, label }: Props) {
  const connected = useConnectionStore((s) => s.connected)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80">
      <div className="text-center space-y-2">
        <div className="text-4xl">{icon}</div>
        <div className="text-sm text-text-secondary">
          {connected ? `Waiting for ${label} data...` : 'Press the Connect button to connect'}
        </div>
        {!connected && (
          <div className="text-xs text-text-muted">
            Header Connect → enter SSE URL → Connect
          </div>
        )}
      </div>
    </div>
  )
}
