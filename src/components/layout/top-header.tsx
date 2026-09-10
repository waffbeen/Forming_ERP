'use client'

import * as React from 'react'
import { Factory, Menu, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { PLANT } from '@/config/plant'
import { USERS } from '@/data'
import { greetingAt, shiftAt, shortDate, workingDate } from '@/lib/plant-clock'
import { useTheme } from '@/components/providers/theme-provider'
import { ThemePicker } from './theme-picker'
import { formatNumber } from '@/lib/utils'

/**
 * The bar over every screen.
 *
 * It carries four things and nothing else: where you are, what you are looking
 * for, when the plant is, and who is signed in. Everything on it is a pill —
 * the same soft shape the panels underneath use — so the chrome reads as one
 * piece of software rather than a strip bolted above the content.
 */
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

  const iconButton =
    'grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-default'

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-bd-subtle bg-bg-header px-3 md:gap-3 md:px-4">
      <button
        type="button"
        onClick={onToggleMobileNav}
        aria-label="Open navigation"
        className={`${iconButton} lg:hidden`}
      >
        <Menu className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        className={`hidden ${iconButton} lg:grid`}
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      {/* Where you are. */}
      <span className="hidden items-center gap-2 rounded-full bg-primary-subtle py-1.5 pl-2 pr-3.5 text-xs sm:inline-flex">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-bg-surface/70">
          <Factory className="h-3 w-3 text-primary" />
        </span>
        <b className="font-semibold">{PLANT.unitName}</b>
        <span className="text-fg-muted">{formatNumber(PLANT.areaSqFt)} sq ft</span>
      </span>

      {/* What you are looking for. */}
      <label className="hidden h-9 max-w-[380px] flex-1 items-center gap-2 rounded-full border border-transparent bg-bg-subtle px-3.5 text-xs transition-colors focus-within:border-primary focus-within:bg-bg-surface md:inline-flex">
        <Search className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        <input
          type="search"
          placeholder="Search SO, job card, artwork code, reel ID"
          aria-label="Search"
          className="w-full bg-transparent text-xs text-fg-default outline-none placeholder:text-fg-subtle"
        />
      </label>

      <div className="flex-1" />

      {/* When the plant is. The dot is the shift actually on. */}
      <span
        className="hidden items-center gap-2 rounded-full bg-bg-subtle py-1.5 pl-2.5 pr-3 text-xs lg:inline-flex"
        title={`Records to ${date}`}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
        <b className="font-semibold">{hour === null ? '—' : `Shift ${shiftAt(hour)}`}</b>
        <span className="text-fg-muted">{shortDate(date)}</span>
      </span>

      <ThemePicker />

      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className={iconButton}
      >
        {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Who is signed in — named, not just an initialled circle. */}
      <span
        className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:bg-bg-subtle sm:pr-3.5"
        title={`${hour === null ? 'Signed in' : greetingAt(hour)}, ${user.userName} · ${user.designation}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-2xs font-semibold text-on-primary">
          {initials}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block truncate text-xs font-semibold">{user.userName}</span>
          <span className="block truncate text-2xs text-fg-muted">{user.designation}</span>
        </span>
      </span>
    </header>
  )
}
