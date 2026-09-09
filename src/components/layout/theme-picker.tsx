'use client'

import * as React from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme, VARIANTS } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

export function ThemePicker() {
  const { variant, setVariant } = useTheme()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change colour theme"
        className="grid h-[30px] w-[30px] place-items-center rounded-md border border-bd-default bg-bg-surface text-fg-muted hover:bg-bg-hover hover:text-fg-default"
      >
        <Palette className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 w-60 animate-slide-up rounded-lg border border-bd-default bg-bg-surface p-1.5 shadow-lg"
        >
          <p className="label-caps px-2 py-1.5">Colour theme</p>
          {VARIANTS.map((v) => {
            const active = v.id === variant
            return (
              <button
                key={v.id}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => {
                  setVariant(v.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                  active ? 'bg-bg-selected' : 'hover:bg-bg-hover',
                )}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ background: v.swatch }}
                />
                <span className="min-w-0 text-sm font-medium">
                  {v.label}
                  <span className="block text-xs font-normal text-fg-muted">{v.description}</span>
                </span>
                {active ? <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
