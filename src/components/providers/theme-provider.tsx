'use client'

import * as React from 'react'

export type Mode = 'light' | 'dark'
export type Variant = 'slate' | 'graphite' | 'burgundy' | 'forest' | 'bronze' | 'indigo'

export interface VariantMeta {
  id: Variant
  label: string
  description: string
  /** Swatch shown in the picker: the light-mode primary of that variant. */
  swatch: string
}

/** Classic, low-saturation palettes only. Nothing fluorescent. */
export const VARIANTS: VariantMeta[] = [
  { id: 'slate', label: 'Slate', description: 'Corporate blue-grey', swatch: '#3A5A78' },
  { id: 'graphite', label: 'Graphite', description: 'Near-neutral charcoal', swatch: '#4A5560' },
  { id: 'indigo', label: 'Indigo', description: 'Deep enterprise blue', swatch: '#3F4A7A' },
  { id: 'forest', label: 'Forest', description: 'Deep green', swatch: '#2C5545' },
  { id: 'burgundy', label: 'Burgundy', description: 'Deep wine', swatch: '#7B2D3B' },
  { id: 'bronze', label: 'Bronze', description: 'Warm brown', swatch: '#8A5A2B' },
]

export const DEFAULT_VARIANT: Variant = 'slate'
export const MODE_KEY = 'forming-erp-mode'
export const VARIANT_KEY = 'forming-erp-variant'

interface ThemeValue {
  mode: Mode
  variant: Variant
  toggleMode: () => void
  setVariant: (v: Variant) => void
}

const ThemeContext = React.createContext<ThemeValue>({
  mode: 'light',
  variant: DEFAULT_VARIANT,
  toggleMode: () => {},
  setVariant: () => {},
})

export const useTheme = () => React.useContext(ThemeContext)

function isVariant(value: string | null): value is Variant {
  return VARIANTS.some((v) => v.id === value)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<Mode>('light')
  const [variant, setVariantState] = React.useState<Variant>(DEFAULT_VARIANT)

  React.useEffect(() => {
    let savedMode: string | null = null
    let savedVariant: string | null = null
    try {
      savedMode = window.localStorage.getItem(MODE_KEY)
      savedVariant = window.localStorage.getItem(VARIANT_KEY)
    } catch {
      // Private windows and blocked site data - fall back to the OS setting.
    }
    setMode(
      savedMode === 'dark' || savedMode === 'light'
        ? savedMode
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
    )
    if (isVariant(savedVariant)) setVariantState(savedVariant)
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    VARIANTS.forEach((v) => root.classList.toggle(`theme-${v.id}`, v.id === variant))
    root.style.colorScheme = mode
    try {
      window.localStorage.setItem(MODE_KEY, mode)
      window.localStorage.setItem(VARIANT_KEY, variant)
    } catch {
      // Nothing to do - the choice just will not survive a reload.
    }
  }, [mode, variant])

  const value = React.useMemo<ThemeValue>(
    () => ({
      mode,
      variant,
      toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      setVariant: setVariantState,
    }),
    [mode, variant],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Applies the stored theme before paint, so the page never flashes the wrong one. */
export function ThemeScript() {
  const js = `(function(){try{var r=document.documentElement;
var m=localStorage.getItem('${MODE_KEY}');
if(m!=='dark'&&m!=='light')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
if(m==='dark')r.classList.add('dark');
r.style.colorScheme=m;
var v=localStorage.getItem('${VARIANT_KEY}');
var ok=${JSON.stringify(VARIANTS.map((v) => v.id))};
r.classList.add('theme-'+(ok.indexOf(v)>-1?v:'${DEFAULT_VARIANT}'));
}catch(e){r.classList.add('theme-${DEFAULT_VARIANT}')}})()`
  return <script dangerouslySetInnerHTML={{ __html: js }} />
}
