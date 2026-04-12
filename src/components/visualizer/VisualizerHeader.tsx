import { useConnectionStore } from '@/stores/connectionStore'
import { useSignalQuality } from '@/hooks/useSignalQuality'
import { StreamingBadge } from './StreamingBadge'
import { SignalQualityBadge } from './SignalQualityBadge'
import { ThemeSwitcher } from './ThemeSwitcher'

export function VisualizerHeader() {
  const connected = useConnectionStore((s) => s.connected)
  const quality = useSignalQuality()

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Visualizer</h1>
        <p className="text-muted-foreground">Real-time sensor data visualization</p>
      </div>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        {connected && <StreamingBadge />}
        {quality && <SignalQualityBadge quality={quality} />}
      </div>
    </div>
  )
}
