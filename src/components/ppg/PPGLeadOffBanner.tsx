import { LeadOffBanner } from '../eeg/LeadOffBanner'

interface Props {
  context?: 'ppg-filter' | 'ppg-sqi' | 'ppg-hrv'
  size?: 'sm' | 'md'
  className?: string
}

export function PPGLeadOffBanner({ context = 'ppg-filter', size = 'sm', className }: Props) {
  return <LeadOffBanner context={context} size={size} className={className} />
}
