import { useState, useEffect } from 'react'

export type Theme = 'purple' | 'black' | 'white'

const STORAGE_KEY = 'sensor-dashboard:theme'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'purple' || stored === 'black' || stored === 'white') return stored
  } catch {}
  return 'purple'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  const setTheme = (t: Theme) => {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch {}
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return { theme, setTheme }
}
