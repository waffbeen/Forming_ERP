'use client'

import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  count?: number
}

export function Tabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <div role="tablist" className="inline-flex gap-0.5 rounded-md border border-bd-default bg-bg-subtle p-0.5">
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors',
              active
                ? 'bg-bg-surface font-semibold text-fg-default shadow-sm'
                : 'text-fg-muted hover:text-fg-default',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="rounded-full bg-primary-subtle px-1.5 text-2xs font-semibold text-primary">
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
