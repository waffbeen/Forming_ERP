'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar, TopHeader } from '@/components/layout'
import { cn } from '@/lib/utils'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(true)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen flex-col bg-bg-app">
      <TopHeader
        onToggleSidebar={() => setCollapsed((v) => !v)}
        onToggleMobileNav={() => setMobileOpen((v) => !v)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop rail. Expanding overlays the content instead of pushing it,
            so the grids underneath keep their width. */}
        <div className="absolute left-0 top-0 z-30 hidden h-full overflow-visible lg:flex">
          <Sidebar
            isCollapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            onNavigate={() => window.setTimeout(() => setCollapsed(true), 250)}
          />
        </div>

        {!collapsed ? (
          <div
            className="absolute inset-0 z-20 hidden bg-black/20 lg:block"
            onClick={() => setCollapsed(true)}
            aria-hidden
          />
        ) : null}

        {/* Mobile drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar
            isCollapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col lg:ml-14">
          <main className="flex-1 animate-fade-in space-y-4 overflow-y-auto p-4 pb-16 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
