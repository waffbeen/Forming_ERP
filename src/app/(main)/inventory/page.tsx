'use client'

import * as React from 'react'
import { AlertTriangle, ArrowDownUp, IndianRupee, Truck } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Column, DataTable, Divider, Panel, PanelBody, PanelHeader,
  SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import {
  BINS, ITEMS, STOCK_BALANCES, STOCK_MOVEMENTS, USERS, itemsBelowReorder, onOrderQty, stockOnHand,
} from '@/data'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { Item } from '@/types/masters'
import type { StockMoveKind, StockMovement } from '@/types/procurement'

const KIND_LABEL: Record<StockMoveKind, string> = {
  GRN_RECEIPT: 'Goods receipt',
  ISSUE_TO_JOB: 'Issue to job',
  RETURN_FROM_JOB: 'Return from job',
  SCRAP_TRANSFER: 'Scrap transfer',
  ADJUSTMENT: 'Adjustment',
}

const KIND_TONE = {
  GRN_RECEIPT: 'success',
  ISSUE_TO_JOB: 'info',
  RETURN_FROM_JOB: 'primary',
  SCRAP_TRANSFER: 'warning',
  ADJUSTMENT: 'muted',
} as const

const TABS = [
  { id: 'STOCK', label: 'Stock on hand', count: ITEMS.length },
  { id: 'MOVEMENTS', label: 'Movements', count: STOCK_MOVEMENTS.length },
]

const binCode = (id: string) => BINS.find((b) => b.binId === id)?.binCode ?? id
const userName = (id: string) => USERS.find((u) => u.userId === id)?.userName ?? id

export default function InventoryPage() {
  const [tab, setTab] = React.useState('STOCK')
  const [selectedItemId, setSelectedItemId] = React.useState(ITEMS[0].itemId)

  const selected = ITEMS.find((i) => i.itemId === selectedItemId) ?? ITEMS[0]
  const selectedBalances = STOCK_BALANCES.filter((b) => b.itemId === selected.itemId)
  const selectedMoves = STOCK_MOVEMENTS.filter((m) => m.itemId === selected.itemId)

  const belowReorder = itemsBelowReorder()
  const stockValue = ITEMS.reduce((s, i) => s + stockOnHand(i.itemId) * i.ratePerUom, 0)
  const onOrderValue = ITEMS.reduce((s, i) => s + onOrderQty(i.itemId) * i.ratePerUom, 0)

  const itemColumns: Column<Item>[] = [
    { key: 'code', header: 'Item', sortValue: (r) => r.itemCode, render: (r) => <StackedCell top={r.itemCode} bottom={r.itemName} mono /> },
    { key: 'uom', header: 'UOM', render: (r) => <span className="font-mono">{r.uom}</span> },
    {
      key: 'onhand',
      header: 'On hand',
      align: 'right',
      sortValue: (r) => stockOnHand(r.itemId),
      render: (r) => {
        const qty = stockOnHand(r.itemId)
        return (
          <span className={qty < r.reorderLevel ? 'font-mono font-semibold text-error' : 'font-mono font-semibold'}>
            {formatNumber(qty, r.uom === 'KG' || r.uom === 'LTR' ? 1 : 0)}
          </span>
        )
      },
    },
    { key: 'reorder', header: 'Reorder at', align: 'right', sortValue: (r) => r.reorderLevel, render: (r) => <span className="font-mono text-fg-muted">{formatNumber(r.reorderLevel)}</span> },
    {
      key: 'onorder',
      header: 'On order',
      align: 'right',
      sortValue: (r) => onOrderQty(r.itemId),
      render: (r) => {
        const qty = onOrderQty(r.itemId)
        return qty > 0 ? <span className="font-mono text-info">{formatNumber(qty)}</span> : <span className="text-fg-subtle">—</span>
      },
    },
    {
      key: 'bins',
      header: 'Bins',
      render: (r) => {
        const bins = STOCK_BALANCES.filter((b) => b.itemId === r.itemId && b.quantity !== 0)
        return bins.length ? (
          <span className="font-mono text-xs">{bins.map((b) => binCode(b.binId)).join(', ')}</span>
        ) : (
          <span className="text-fg-subtle">Empty</span>
        )
      },
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      sortValue: (r) => stockOnHand(r.itemId) * r.ratePerUom,
      render: (r) => <span className="font-mono">{formatCurrency(stockOnHand(r.itemId) * r.ratePerUom, 0)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        stockOnHand(r.itemId) < r.reorderLevel ? (
          <Badge tone="error">Below reorder</Badge>
        ) : (
          <Badge tone="success">In stock</Badge>
        ),
    },
  ]

  const moveColumns: Column<StockMovement>[] = [
    { key: 'date', header: 'Date', sortValue: (r) => r.movedOn, render: (r) => <span className="font-mono">{formatDate(r.movedOn)}</span> },
    { key: 'kind', header: 'Movement', sortValue: (r) => r.kind, render: (r) => <Badge tone={KIND_TONE[r.kind]}>{KIND_LABEL[r.kind]}</Badge> },
    {
      key: 'item',
      header: 'Item',
      sortValue: (r) => r.itemId,
      render: (r) => {
        const item = ITEMS.find((i) => i.itemId === r.itemId)
        return <StackedCell top={item?.itemCode ?? r.itemId} bottom={item?.itemName} mono />
      },
    },
    { key: 'bin', header: 'Bin', sortValue: (r) => r.binId, render: (r) => <span className="font-mono">{binCode(r.binId)}</span> },
    {
      key: 'qty',
      header: 'Quantity',
      align: 'right',
      sortValue: (r) => r.quantity,
      render: (r) => (
        <span className={r.quantity < 0 ? 'font-mono font-semibold text-error' : 'font-mono font-semibold text-success'}>
          {r.quantity > 0 ? '+' : ''}
          {formatNumber(r.quantity, 1)}
        </span>
      ),
    },
    { key: 'reel', header: 'Reel', render: (r) => (r.reelId ? <span className="font-mono">{r.reelId}</span> : <span className="text-fg-subtle">—</span>) },
    { key: 'ref', header: 'Reference', sortValue: (r) => r.reference, render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: 'by', header: 'By', render: (r) => userName(r.byUserId) },
  ]

  return (
    <>
      <PageHeader eyebrow="Procurement" title="Inventory" />

      <StatsGrid>
        <StatsCard label="Stock value" value={formatNumber(stockValue / 100000, 2)} unit="lakh" note={`${ITEMS.length} item codes`} icon={IndianRupee} />
        <StatsCard label="Movements logged" value={String(STOCK_MOVEMENTS.length)} note="Receipts, issues and returns" icon={ArrowDownUp} />
        <StatsCard
          label="Below reorder"
          value={String(belowReorder.length)}
          note={belowReorder.map((i) => i.itemCode).slice(0, 2).join(', ') || 'None'}
          noteTone={belowReorder.length ? 'bad' : 'good'}
          icon={AlertTriangle}
        />
        <StatsCard label="On order" value={formatNumber(onOrderValue / 100000, 2)} unit="lakh" note="Committed, not yet received" icon={Truck} />
      </StatsGrid>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {tab === 'STOCK' ? (
          <DataTable
            title="Stock on hand"
            rows={ITEMS}
            columns={itemColumns}
            rowKey={(r) => r.itemId}
            mainColumns="code,onhand,reorder,status"
            toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
            selectedKey={selected.itemId}
            onSelect={(r) => setSelectedItemId(r.itemId)}
          />
        ) : (
          <DataTable
            title="Stock movements"
            rows={STOCK_MOVEMENTS}
            columns={moveColumns}
            rowKey={(r) => r.movementId}
            mainColumns="date,kind,item,qty"
            toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          />
        )}

        <Panel>
          <PanelHeader
            title="Item detail"
            description={<span className="font-mono">{selected.itemCode}</span>}
            action={
              stockOnHand(selected.itemId) < selected.reorderLevel ? (
                <Badge tone="error">Below reorder</Badge>
              ) : (
                <Badge tone="success">In stock</Badge>
              )
            }
          />
          <PanelBody>
            <SpecList
              rows={[
                { label: 'Item', value: selected.itemName, mono: false },
                { label: 'On hand', value: `${formatNumber(stockOnHand(selected.itemId), 1)} ${selected.uom}`, emphasis: true },
                { label: 'Reorder level', value: `${formatNumber(selected.reorderLevel)} ${selected.uom}` },
                { label: 'On order', value: `${formatNumber(onOrderQty(selected.itemId))} ${selected.uom}` },
                { label: 'Rate', value: `${formatCurrency(selected.ratePerUom, 2)} / ${selected.uom}` },
              ]}
            />

            <Divider />
            <p className="label-caps mb-1.5">Held in</p>
            {selectedBalances.length ? (
              <ul className="space-y-1">
                {selectedBalances.map((b) => (
                  <li key={b.binId} className="flex items-center justify-between font-mono text-xs">
                    <span>{binCode(b.binId)}</span>
                    <span className="font-semibold">{formatNumber(b.quantity, 1)} {selected.uom}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-fg-subtle">No stock in any bin.</p>
            )}

            <Divider />
            <p className="label-caps mb-1.5">Recent movements</p>
            {selectedMoves.length ? (
              <ul className="space-y-1.5">
                {selectedMoves.slice(0, 6).map((m) => (
                  <li key={m.movementId} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0">
                      <span className="block truncate">{KIND_LABEL[m.kind]}</span>
                      <span className="block font-mono text-fg-muted">{m.reference} · {formatDate(m.movedOn)}</span>
                    </span>
                    <span className={m.quantity < 0 ? 'shrink-0 font-mono font-semibold text-error' : 'shrink-0 font-mono font-semibold text-success'}>
                      {m.quantity > 0 ? '+' : ''}
                      {formatNumber(m.quantity, 1)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-fg-subtle">Nothing has moved yet.</p>
            )}

            <Divider />
            <Note>
              On hand is the running sum of the movements above, not a stored number, so any balance can be explained
              by the rows behind it.
            </Note>
          </PanelBody>
        </Panel>
      </div>
    </>
  )
}
