/**
 * Page shell used across the app: a centred title, then the page actions on
 * their own right-aligned row above the grid. Same arrangement as Indas Estimo,
 * so the two products read the same to the people who use both.
 */
export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string
  title: string
  actions?: React.ReactNode
}) {
  return (
    <>
      <div className="text-center">
        {eyebrow ? <p className="eyebrow mb-0.5">{eyebrow}</p> : null}
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>

      {actions ? <div className="flex items-center justify-end gap-2">{actions}</div> : null}
    </>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs text-fg-muted">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-5M12 8h.01" />
      </svg>
      <span>{children}</span>
    </p>
  )
}
