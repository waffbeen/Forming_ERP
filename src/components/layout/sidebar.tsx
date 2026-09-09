'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_SECTIONS, type NavSection } from '@/config/navigation'
import { PLANT } from '@/config/plant'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  /** Called after a link is followed, so the rail can collapse again. */
  onNavigate?: () => void
  className?: string
}

/**
 * Collapsed to a 56 px icon rail by default, matching Indas Estimo. Expanding
 * overlays the content rather than pushing it, so the grids underneath keep
 * their width. When collapsed, hovering a group flies its items out to the side.
 */
export function Sidebar({ isCollapsed, onToggle, onNavigate, className }: SidebarProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = React.useState<string[]>(() =>
    NAV_SECTIONS.filter((s) => s.items.length > 1).map((s) => s.title),
  )
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null)
  const [flyoutTop, setFlyoutTop] = React.useState(0)
  const hoverTimer = React.useRef<number | null>(null)

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const groupActive = (section: NavSection) => section.items.some((i) => isActive(i.href))

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))

  const openFlyout = (section: NavSection, e: React.MouseEvent<HTMLElement>) => {
    if (!isCollapsed) return
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    setFlyoutTop(Math.max(e.currentTarget.getBoundingClientRect().top - 8, 8))
    setHoveredGroup(section.title)
  }

  const closeFlyoutSoon = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHoveredGroup(null), 180)
  }

  const keepFlyout = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
  }

  React.useEffect(() => () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
  }, [])

  return (
    <>
      <div
        className={cn(
          'flex h-full flex-col border-r border-white/10 bg-bg-sidebar shadow-lg transition-all duration-300',
          isCollapsed ? 'w-14 overflow-visible' : 'w-60 md:w-64',
          className,
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-[52px] shrink-0 items-center gap-2.5 border-b border-white/10', isCollapsed ? 'justify-center px-2' : 'px-4')}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 8h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M3 8l3-4h12l3 4" />
              <path d="M9 12h6" />
            </svg>
          </span>
          {!isCollapsed ? (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-white">{PLANT.companyName}</span>
              <span className="block truncate text-2xs uppercase tracking-[0.09em] text-white/55">
                {PLANT.productName}
              </span>
            </span>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-visible p-2">
          <ul className="space-y-1">
            {NAV_SECTIONS.map((section) => {
              const single = section.items.length === 1
              const open = openGroups.includes(section.title) && !isCollapsed
              const active = groupActive(section)

              // A one-item section renders as a plain link, not a group.
              if (single) {
                const item = section.items[0]
                const Icon = item.icon
                return (
                  <li key={section.title}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={isCollapsed ? item.label : undefined}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors',
                        'hover:bg-white/20 hover:text-white',
                        isCollapsed && 'justify-center px-2',
                        isActive(item.href) && 'bg-white/20 text-white',
                      )}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', !isCollapsed && 'mr-3')} />
                      {!isCollapsed ? item.label : null}
                    </Link>
                  </li>
                )
              }

              return (
                <li
                  key={section.title}
                  className={cn('relative overflow-visible', isCollapsed && 'group')}
                  onMouseLeave={isCollapsed ? closeFlyoutSoon : undefined}
                >
                  <button
                    type="button"
                    onClick={() => (isCollapsed ? onToggle() : toggleGroup(section.title))}
                    onMouseEnter={(e) => openFlyout(section, e)}
                    aria-expanded={open}
                    title={isCollapsed ? section.title : undefined}
                    className={cn(
                      'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors',
                      'hover:bg-white/20 hover:text-white',
                      isCollapsed && 'justify-center px-2',
                      active && 'bg-white/10 text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-[18px] w-[18px] shrink-0 place-items-center',
                        !isCollapsed && 'mr-3',
                      )}
                    >
                      {React.createElement(section.items[0].icon, { className: 'h-[18px] w-[18px]' })}
                    </span>
                    {!isCollapsed ? (
                      <>
                        <span className="truncate text-left">{section.title}</span>
                        <ChevronDown
                          className={cn(
                            'ml-auto h-3.5 w-3.5 shrink-0 transition-transform',
                            open && 'rotate-180',
                          )}
                        />
                      </>
                    ) : null}
                  </button>

                  {/* Expanded: items nested under the group */}
                  {open ? (
                    <ul className="mt-0.5 space-y-0.5 border-l border-white/15 pl-3 ml-4">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={onNavigate}
                              aria-current={isActive(item.href) ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-white/65 transition-colors',
                                'hover:bg-white/20 hover:text-white',
                                isActive(item.href) && 'bg-white/20 font-medium text-white',
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                              {item.badge ? (
                                <span className="ml-auto shrink-0 rounded-full bg-white/15 px-1.5 text-2xs text-white/75">
                                  {item.badge}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={cn(
              'flex w-full items-center rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/20 hover:text-white',
              isCollapsed && 'justify-center px-2',
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="mr-3 h-[18px] w-[18px]" />
                Collapse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed-rail flyout */}
      {isCollapsed && hoveredGroup ? (
        <div
          className="fixed z-50 hidden w-56 rounded-lg border border-bd-default bg-bg-surface p-1.5 shadow-lg lg:block"
          style={{ left: 68, top: flyoutTop }}
          onMouseEnter={keepFlyout}
          onMouseLeave={closeFlyoutSoon}
        >
          <p className="label-caps px-2 py-1.5">{hoveredGroup}</p>
          {NAV_SECTIONS.find((s) => s.title === hoveredGroup)?.items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setHoveredGroup(null)
                  onNavigate?.()
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-bg-selected font-medium text-fg-default'
                    : 'text-fg-muted hover:bg-bg-hover hover:text-fg-default',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto shrink-0 rounded-full bg-primary-subtle px-1.5 text-2xs font-semibold text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
