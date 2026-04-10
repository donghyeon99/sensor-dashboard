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
          {connected ? `${label} 데이터 수신 대기 중...` : 'Connect 버튼을 눌러 연결해주세요'}
        </div>
        {!connected && (
          <div className="text-xs text-text-muted">
            헤더의 Connect → SSE URL 입력 → Connect
          </div>
        )}
      </div>
    </div>
  )
}
