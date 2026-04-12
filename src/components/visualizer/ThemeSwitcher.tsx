import { useTheme, type Theme } from '../../hooks/useTheme'

const themes: { id: Theme; color: string; ring: string; label: string }[] = [
  { id: 'purple', color: 'bg-purple-600', ring: 'ring-purple-400', label: 'Purple' },
  { id: 'black', color: 'bg-neutral-900 border border-neutral-600', ring: 'ring-neutral-400', label: 'Black' },
  { id: 'white', color: 'bg-white border border-gray-300', ring: 'ring-gray-400', label: 'White' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1.5">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`w-6 h-6 rounded-full cursor-pointer transition-all ${t.color} ${
            theme === t.id ? `ring-2 ring-offset-1 ring-offset-transparent ${t.ring} scale-110` : 'opacity-60 hover:opacity-100'
          }`}
          title={t.label}
        />
      ))}
    </div>
  )
}
