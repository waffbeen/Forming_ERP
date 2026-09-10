'use client'

import * as React from 'react'
import { Factory, Menu, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { PLANT } from '@/config/plant'
import { USERS } from '@/data'
import { greetingAt, shiftAt, shortDate, workingDate } from '@/lib/plant-clock'
import { useTheme } from '@/components/providers/theme-provider'
import { ThemePicker } from './theme-picker'
import { formatNumber } from '@/lib/utils'

export function TopHeader({
  onToggleSidebar,
  onToggleMobileNav,
}: {
  onToggleSidebar: () => void
  onToggleMobileNav: () => void
}) {
  const { mode, toggleMode } = useTheme()

  /* Whoever is signed in. One admin for now, but the header should read off the
     user record rather than have somebody's initials typed into it. */
  const user = USERS.find((u) => u.isAdmin && u.status === 'ACTIVE') ?? USERS[0]
  const initials = user.userName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  /* The terminal's hour, read after mount: the server is not in it. */
  const [hour, setHour] = React.useState<number | null>(null)
  React.useEffect(() => setHour(new Date().getHours()), [])
  const date = workingDate()

  return (
    <header className="z-40 flex h-[52px] shrink-0 items-center gap-3 border-b border-bd-default bg-bg-header px-3 md:px-4">
      <button
        type="button"
        onClick={onToggleMobileNav}
        aria-label="Open navigation"
        className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-default lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        className="hidden h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-default lg:grid"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      <span className="hidden items-center gap-2 rounded-md border border-bd-default bg-bg-subtle px-2.5 py-1 text-xs sm:inline-flex">
        <Factory className="h-3.5 w-3.5 text-fg-muted" />
        <b className="font-semibold">{PLANT.unitName}</b>
        <span className="text-fg-muted">{formatNumber(PLANT.areaSqFt)} sq ft</span>
      </span>

      <label className="hidden max-w-[320px] flex-1 items-center gap-2 rounded-md border border-bd-default bg-bg-subtle px-2.5 py-1.5 text-xs focus-within:border-primary md:inline-flex">
        <Search className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        <input
          type="search"
          placeholder="Search SO, job card, artwork code, reel ID"
          aria-label="Search"
          className="w-full bg-transparent text-xs text-fg-default outline-none placeholder:text-fg-subtle"
        />
      </label>

      <div className="flex-1" />

      <span
        className="hidden border-l border-bd-default pl-3 text-2xs uppercase tracking-[0.06em] text-fg-muted lg:inline"
        title={`Working date ${date}`}
      >
        {hour === null ? shortDate(date) : `Shift ${shiftAt(hour)} · ${shortDate(date)}`}
      </span>

      <ThemePicker />

      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="grid h-[30px] w-[30px] place-items-center rounded-md border border-bd-default bg-bg-surface text-fg-muted hover:bg-bg-hover hover:text-fg-default"
      >
        {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>

      <span
        className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-primary text-2xs font-semibold text-on-primary"
        title={`${hour === null ? 'Signed in' : greetingAt(hour)}, ${user.userName} · ${user.designation}`}
      >
        {initials}
      </span>
    </header>
  )
}
