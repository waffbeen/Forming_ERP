'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { ArtworkModal } from '@/components/modals'
import { ARTWORKS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateNesting } from '@/lib/layout-calc'
import { formatMicrons } from '@/lib/utils'
import type { ArtworkMaster, TrayType } from '@/types'

const TRAY_LABEL: Record<TrayType, string> = {
  TRANSPARENT: 'Clear',
  HIPS_WHITE: 'White HIPS',
  AMBER: 'Amber',
  GREEN: 'Green',
}

const TRAY_TONE = {
  TRANSPARENT: 'info',
  HIPS_WHITE: 'muted',
  AMBER: 'warning',
  GREEN: 'success',
} as const

const columns: Column<ArtworkMaster>[] = [
  { key: 'code', sortValue: (r) => r.artworkCode, header: 'Artwork code', render: (r) => <StackedCell top={r.artworkCode} bottom={r.customerName} mono /> },
  { key: 'ref', sortValue: (r) => r.clientProductRef, header: 'Customer reference', render: (r) => r.clientProductRef },
  { key: 'tray', sortValue: (r) => r.trayType, header: 'Tray type', render: (r) => <Badge tone={TRAY_TONE[r.trayType]}>{TRAY_LABEL[r.trayType]}</Badge> },
  {
    key: 'material', sortValue: (r) => r.materialType,
    header: 'Material',
    render: (r) => (
      <>
        {r.materialType} · <span className="font-mono">{formatMicrons(r.thicknessMicrons)}</span>
      </>
    ),
  },
  {
    key: 'layout',
    header: 'Open layout',
    align: 'right',
    render: (r) => (
      <span className="font-mono">
        {r.openLengthMm} × {r.openWidthMm} mm
      </span>
    ),
  },
  { key: 'depth', sortValue: (r) => r.depthMm, header: 'Depth', align: 'right', render: (r) => <span className="font-mono">{r.depthMm} mm</span> },
  {
    key: 'ups',
    header: 'Ups / sheet',
    align: 'right',
    render: (r) => {
      const nest = calculateNesting({
        openLengthMm: r.openLengthMm,
        openWidthMm: r.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
      return <span className="font-mono font-semibold">{nest.upsPerSheet}</span>
    },
  },
  { key: 'drawing', header: 'Drawing', render: (r) => <span className="font-mono">{r.drawingRef}</span> },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (r.approved ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>),
  },
]

export default function ArtworkMasterPage() {
  const approved = ARTWORKS.filter((a) => a.approved).length

  return (
    <MasterPage
      title="Artwork Master"
      entityName="artwork"
      rows={ARTWORKS}
      columns={columns}
      rowKey={(r) => r.artworkId}
      createModal={(props) => <ArtworkModal {...props} />}
    />
  )
}
