import type { Category } from '../../types/sensor'

interface Props {
  active: Category
  onChange: (cat: Category) => void
}

const tabs: { id: Category; label: string; icon: string }[] = [
  { id: 'eeg', label: 'EEG', icon: '🧠' },
  { id: 'ppg', label: 'PPG', icon: '❤️' },
  { id: 'acc', label: 'ACC', icon: '📐' },
]

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 px-7 py-3 border-b border-border bg-bg-card/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border ${
            active === tab.id
              ? 'bg-teal/15 border-teal/30 text-teal'
              : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
