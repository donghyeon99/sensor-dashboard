// Design Ref: §3.6 D6 — 4-level signal quality badge
import { Badge } from '@/components/shadcn/badge'
import type { SignalQuality } from '@/hooks/useSignalQuality'

interface Props {
  quality: SignalQuality
}

const QUALITY_LABEL: Record<SignalQuality, string> = {
  excellent: 'Signal Quality: Excellent',
  good: 'Signal Quality: Good',
  warning: 'Signal Quality: Warning',
  bad: 'Signal Quality: Bad',
}

const QUALITY_VARIANT: Record<SignalQuality, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  excellent: 'default',
  good: 'secondary',
  warning: 'outline',
  bad: 'destructive',
}

export function SignalQualityBadge({ quality }: Props) {
  return <Badge variant={QUALITY_VARIANT[quality]}>{QUALITY_LABEL[quality]}</Badge>
}
