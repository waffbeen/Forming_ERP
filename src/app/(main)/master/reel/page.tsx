'use client'

import { AlertTriangle, CheckCircle2, Disc3, Weight } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Column, StackedCell } from '@/components/ui'
import { ReelModal } from '@/components/modals'
import { QcStatusBadge } from '@/lib/shared-ui'
import { REELS } from '@/data'
import { PLANT } from '@/config/plant'
import { formatDate, formatMicrons, formatNumber } from '@/lib/utils'
import type { Reel } from '@/types'

const columns: Column<Reel>[] = [
  { key: 'reel', sortValue: (r) => r.reelId, header: 'Reel ID', render: (r) => <StackedCell top={r.reelId} bottom={r.grnNumber} mono /> },
  { key: 'mat', sortValue: (r) => r.materialType, header: 'Material', render: (r) => r.materialType },
  {
    key: 'thk', sortValue: (r) => r.thicknessMicrons,
    header: 'Thickness',
    align: 'right',
    render: (r) => (
      <span className={r.thicknessMicrons < PLANT.minMicrons ? 'font-mono font-semibold text-error' : 'font-mono'}>
        {formatMicrons(r.thicknessMicrons)}
      </span>
    ),
  },
  { key: 'deckle', header: 'Deckle', align: 'right', render: (r) => <span className="font-mono">{r.deckleWidthMm} mm</span> },
  { key: 'gross', sortValue: (r) => r.grossWeightKg, header: 'Gross kg', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.grossWeightKg, 1)}</span> },
  {
    key: 'net', sortValue: (r) => r.netWeightKg,
    header: 'Available kg',
    align: 'right',
    render: (r) => <span className="font-mono font-semibold">{formatNumber(r.netWeightKg, 1)}</span>,
  },
  { key: 'sup', sortValue: (r) => r.supplier, header: 'Supplier', render: (r) => r.supplier },
  { key: 'recv', sortValue: (r) => r.receivedOn, header: 'Received', render: (r) => <span className="font-mono">{formatDate(r.receivedOn)}</span> },
  { key: 'loc', header: 'Location', render: (r) => r.storageLocation },
  { key: 'qc', sortValue: (r) => r.qcStatus, header: 'IQC', render: (r) => <QcStatusBadge status={r.qcStatus} /> },
]

export default function ReelMasterPage() {
  const approved = REELS.filter((r) => r.qcStatus === 'APPROVED')
  const availableKg = approved.reduce((s, r) => s + r.netWeightKg, 0)
  const quarantined = REELS.filter((r) => r.qcStatus === 'QUARANTINE')
  const rejected = REELS.filter((r) => r.qcStatus === 'REJECTED')

  return (
    <MasterPage
      title="Reel Stock"
      entityName="reel"
      stats={[
        { label: 'Reels on hand', value: String(REELS.length), note: `${approved.length} in the approved bin`, icon: Disc3 },
        { label: 'Available stock', value: formatNumber(availableKg, 1), unit: 'kg', note: 'Net of what is on the floor', icon: Weight },
        {
          label: 'In quarantine',
          value: String(quarantined.length),
          note: 'Held pending IQC decision',
          noteTone: 'warn',
          icon: AlertTriangle,
        },
        {
          label: 'Rejected',
          value: String(rejected.length),
          note: `Below the ${PLANT.minMicrons} µm floor`,
          noteTone: 'bad',
          icon: CheckCircle2,
        },
      ]}
      rows={REELS}
      columns={columns}
      rowKey={(r) => r.reelId}
      createModal={(props) => <ReelModal {...props} />}
    />
  )
}
