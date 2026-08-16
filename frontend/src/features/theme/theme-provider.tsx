import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const THEMES = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'light-bloody', label: 'Кровавая светлая' },
  { id: 'dark-bloody', label: 'Кровавая тёмная' },
  { id: 'cyberpunk', label: 'Киберпанк' },
  { id: 'pixel', label: 'Пиксельная' },
  { id: 'liquid-glass', label: 'Жидкое стекло' },
] as const

export type Theme = (typeof THEMES)[number]['id']

const DARK_THEMES: ReadonlySet<Theme> = new Set(['dark', 'dark-bloody', 'cyberpunk'])
const STORAGE_KEY = 'ui-theme'
const DEFAULT_THEME: Theme = 'light'

function isTheme(value: string | null): value is Theme {
  return THEMES.some((t) => t.id === value)
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', DARK_THEMES.has(theme))
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function setTheme(next: Theme) {
    setThemeState(next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
