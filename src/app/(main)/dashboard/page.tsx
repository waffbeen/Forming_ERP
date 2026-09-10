'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight, Boxes, ClipboardCheck, Factory, PackageX, PauseCircle, Recycle, ShieldAlert,
  TriangleAlert, Truck, Wrench,
} from 'lucide-react'
import { Note } from '@/components/layout'
import { Badge, Panel, PanelBody, PanelHeader, Divider } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import { Meter, StageColumns, StatTile } from '@/components/dashboard'
import {
  GRNS, JOB_CARDS, MACHINES, NON_CONFORMANCES, PRODUCTION_ENTRIES, SALES_ORDERS, SCRAP_ENTRIES,
  WORK_ORDERS, FORMING_LOGS, USERS, SCHEDULE_SLOTS,
  heldQty, itemsBelowReorder, jobsAwaitingIssue, negativeBalances, pendingQcLines, rejectedQty,
} from '@/data'
import { PLANT } from '@/config/plant'
import { greetingAt, shiftAt, workingDate } from '@/lib/plant-clock'
import { formatKg, formatNumber, formatPercent } from '@/lib/utils'
import type { JobStage } from '@/types'

/* The plant dashboard.

   Written for the person who opens it at the start of a shift and wants three
   answers: what is running, what is stuck, and are we going to make the
   deliveries. Everything here is derived from the same records the rest of the
   app posts — nothing on this screen is a figure of its own.

   The figures are all one hue against a track, because they are all the same
   question: how much of a whole. The status colours are kept for status, and
   never sit next to each other in one bar — the plant's green, amber and red
   fail a colourblind separation check when adjacent, so a comparison of three
   states gets a labelled row each instead. */

const STAGE_ORDER: JobStage[] = ['REEL_ISSUE', 'FORMING', 'CUTTING', 'SORTING', 'PACKING']

const STAGE_LABEL: Record<JobStage, string> = {
  REEL_ISSUE: 'Material',
  FORMING: 'Forming',
  CUTTING: 'Cutting',
  SORTING: 'Sorting',
  PACKING: 'Packing',
}

/** The stage a job is actually sitting at: the first one not finished. */
function currentStage(job: (typeof JOB_CARDS)[number]): JobStage | null {
  return STAGE_ORDER.find((s) => job.stages[s] !== 'DONE') ?? null
}

/** "Tue 09", which is how a day reads on a shop-floor board. */
function shortDay(iso: string) {
  const date = new Date(iso)
  return `${date.toLocaleString('en-IN', { weekday: 'short' })} ${date.getDate()}`
}

/** One of a thing reads differently from several, and the screen should say so. */
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)

export default function DashboardPage() {
  const today = workingDate()

  /* Who is looking, and when. The hour is the terminal's own and has to be read
     after mount — the server is in a different one, and a greeting rendered
     there would be replaced the moment the page arrives. */
  const user = USERS.find((u) => u.isAdmin && u.status === 'ACTIVE') ?? USERS[0]
  const [hour, setHour] = React.useState<number | null>(null)
  React.useEffect(() => setHour(new Date().getHours()), [])
  const firstName = user.userName.split(' ')[0]

  // ------------------------------------------------------------ the floor
  const machines = MACHINES.map((machine) => {
    const entries = PRODUCTION_ENTRIES.filter((e) => e.machineCode === machine.machineCode)
    const running = entries.find((e) => e.status === 'RUNNING') ?? entries[entries.length - 1]
    const order = running ? WORK_ORDERS.find((w) => w.pwoNumber === running.pwoNumber) : undefined
    const job = running ? JOB_CARDS.find((j) => j.jobCardNo === running.jobCardNo) : undefined
    const downtime = entries.reduce((s, e) => s + e.downtimeMinutes, 0)
    const runMinutes = entries.reduce((s, e) => s + e.runMinutes, 0)
    return { machine, running, order, job, downtime, runMinutes }
  })

  const runningCount = MACHINES.filter((m) => m.status === 'RUNNING').length
  const downtimeMinutes = PRODUCTION_ENTRIES.reduce((s, e) => s + e.downtimeMinutes, 0)

  // ------------------------------------------------- output and the order book
  const cutting = WORK_ORDERS.filter((w) => w.machineType === 'CUTTING')
  const producedPcs = cutting.reduce((s, w) => s + w.producedQty, 0)
  const targetPcs = cutting.reduce((s, w) => s + w.targetQty, 0)
  const rejectedPcs = PRODUCTION_ENTRIES.reduce((s, e) => s + e.rejectedQty, 0)

  const consumedKg = FORMING_LOGS.reduce((s, f) => s + f.consumedWeightKg, 0)
  const scrapKg = SCRAP_ENTRIES.reduce((s, e) => s + e.totalKg, 0)
  const yieldPct = consumedKg > 0 ? ((consumedKg - scrapKg) / consumedKg) * 100 : 0

  // --------------------------------------------------------- work in progress
  const stageCounts = STAGE_ORDER.map((stage) => ({
    label: STAGE_LABEL[stage],
    count: JOB_CARDS.filter((j) => currentStage(j) === stage).length,
    tone: JOB_CARDS.some((j) => currentStage(j) === stage && j.stages[stage] === 'BLOCKED')
      ? ('warning' as const)
      : ('primary' as const),
  }))
  const finished = JOB_CARDS.filter((j) => currentStage(j) === null).length

  // ----------------------------------------------------------- material position
  const approvedKg = GRNS.flatMap((g) => g.lines).reduce((s, l) => s + l.approvedQty, 0)
  const held = heldQty()
  const returned = rejectedQty()
  const materialPeak = Math.max(approvedKg, held, returned, 1)

  // ------------------------------------------------------------- what is stuck
  const pendingBatches = pendingQcLines()
  const awaitingIssue = jobsAwaitingIssue()
  const atGate = JOB_CARDS.filter((j) => Object.values(j.stages).includes('BLOCKED'))
  const openNcs = NON_CONFORMANCES.filter((n) => n.status !== 'CLOSED')
  const toReturn = GRNS.flatMap((g) => g.lines).filter((l) => l.rejectedQty > 0)
  const belowReorder = itemsBelowReorder()
  const negatives = negativeBalances()

  const exceptions = [
    {
      href: '/quality/rm-qc',
      icon: ClipboardCheck,
      count: pendingBatches.length,
      title: plural(pendingBatches.length, 'batch waiting on incoming QC', 'batches waiting on incoming QC'),
      detail: `${formatKg(pendingBatches.reduce((s, l) => s + l.receivedQty, 0))} booked in and not stock yet`,
      tone: 'warning' as BadgeTone,
    },
    {
      href: '/inventory/material-issue',
      icon: Truck,
      count: awaitingIssue.length,
      title: plural(awaitingIssue.length, 'job card waiting on the store', 'job cards waiting on the store'),
      detail: 'Forming cannot be posted until a reel is issued',
      tone: 'warning' as BadgeTone,
    },
    {
      href: '/quality/line-clearance',
      icon: ShieldAlert,
      count: atGate.length,
      title: plural(atGate.length, 'job held at the machine gate', 'jobs held at the machine gate'),
      detail: 'Line clearance or first piece still unsigned',
      tone: 'error' as BadgeTone,
    },
    {
      href: '/quality/nc',
      icon: TriangleAlert,
      count: openNcs.length,
      title: plural(openNcs.length, 'non-conformance open', 'non-conformances open'),
      detail: 'Raised on the floor, not yet closed out',
      tone: 'error' as BadgeTone,
    },
    {
      href: '/quality/rm-qc',
      icon: PackageX,
      count: toReturn.length,
      title: plural(
        toReturn.length,
        'receipt line going back to a supplier',
        'receipt lines going back to a supplier',
      ),
      detail: `${formatKg(returned)} rejected at incoming inspection`,
      tone: 'error' as BadgeTone,
    },
    {
      href: '/inventory',
      icon: PauseCircle,
      count: belowReorder.length + negatives.length,
      title: plural(
        belowReorder.length + negatives.length,
        'item below reorder level',
        'items below reorder level',
      ),
      detail: negatives.length > 0 ? `${negatives.length} bins reading negative` : 'Cover the next order before it lands',
      tone: 'warning' as BadgeTone,
    },
  ].filter((e) => e.count > 0)

  /* Pieces cut per day, over the days the floor has actually posted. Only the
     presses count here: forming is measured in sheets, and two units never
     share one axis. */
  const cuttingPwos = new Set(cutting.map((w) => w.pwoNumber))
  const days = [...new Set(PRODUCTION_ENTRIES.map((e) => e.entryDate))].sort()
  const perDay = days.map((day) => ({
    label: shortDay(day),
    count: PRODUCTION_ENTRIES.filter((e) => e.entryDate === day && cuttingPwos.has(e.pwoNumber)).reduce(
      (sum, e) => sum + e.producedQty,
      0,
    ),
    /* Today reads in the plant's own hue; the days behind it recede. */
    tone: day === today ? ('primary' as const) : ('muted' as const),
  }))

  /** What today alone produced, which is the figure the shift is judged on. */
  const piecesToday = PRODUCTION_ENTRIES.filter(
    (e) => e.entryDate === today && cuttingPwos.has(e.pwoNumber),
  ).reduce((sum, e) => sum + e.producedQty, 0)

  /** What planning put on the machines for today, in the order they run. */
  const todaySlots = SCHEDULE_SLOTS.filter((slot) => slot.scheduledDate === today).sort(
    (a, b) => a.machineCode.localeCompare(b.machineCode) || a.sequenceNo - b.sequenceNo,
  )

  /** Minutes each machine stood still, which is the only figure here to drive down. */
  const stoppages = MACHINES.map((machine) => ({
    label: machine.machineCode,
    count: PRODUCTION_ENTRIES.filter((e) => e.machineCode === machine.machineCode).reduce(
      (sum, e) => sum + e.downtimeMinutes,
      0,
    ),
    tone: 'warning' as const,
  }))

  // ----------------------------------------------------------------- deliveries
  const deliveries = SALES_ORDERS.flatMap((order) =>
    order.lines.map((line) => {
      const job = JOB_CARDS.find(
        (j) => j.soNumber === order.soNumber && j.artworkCode === line.artworkCode,
      )
      const made = job
        ? WORK_ORDERS.filter((w) => w.jobCardNo === job.jobCardNo && w.machineType === 'CUTTING').reduce(
            (s, w) => s + w.producedQty,
            0,
          )
        : 0
      return {
        key: line.lineId,
        soNumber: order.soNumber,
        customerName: order.customerName,
        artworkCode: line.artworkCode ?? line.productCode ?? '—',
        ordered: line.orderQtyPcs,
        made,
        deliveryDate: line.deliveryDate,
        daysLeft: daysBetween(today, line.deliveryDate),
        jobCardNo: job?.jobCardNo ?? null,
      }
    }),
  )
    .filter((d) => d.made < d.ordered)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6)

  return (
    <>
      {/* This screen is the front door, so it opens by name rather than with a
          page title like the working screens behind it. */}
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-bd-subtle bg-primary-subtle px-5 py-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {hour === null ? 'Welcome back' : greetingAt(hour)}, {firstName}
            <span className="ml-2" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {user.designation} · {PLANT.companyName}, {PLANT.unitName} · records to{' '}
            <span className="font-mono">{today}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hour !== null ? (
            <span className="rounded-full bg-bg-surface/80 px-3 py-1 text-xs font-medium">
              Shift {shiftAt(hour)}
            </span>
          ) : null}
          <span className="rounded-full bg-bg-surface/80 px-3 py-1 text-xs font-medium">
            {runningCount} of {MACHINES.length} machines running
          </span>
          <span
            className={
              exceptions.length === 0
                ? 'rounded-full bg-success px-3 py-1 text-xs font-medium text-fg-inverse'
                : 'rounded-full bg-warning px-3 py-1 text-xs font-medium text-fg-inverse'
            }
          >
            {exceptions.length === 0
              ? 'Nothing waiting'
              : `${exceptions.length} ${plural(exceptions.length, 'thing needs you', 'things need you')}`}
          </span>
        </div>
      </section>

      {/* The four figures the plant is judged on, each one a way in. */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          href="/production/entry"
          tint="primary"
          icon={Boxes}
          label="Pieces cut today"
          value={formatNumber(piecesToday)}
          unit="pcs"
          foot={`${formatNumber(producedPcs)} on live job cards so far`}
        />
        <StatTile
          href="/production/entry"
          tint={runningCount > 0 ? 'success' : 'info'}
          icon={Factory}
          label="Machines running"
          value={`${runningCount} / ${MACHINES.length}`}
          foot={
            downtimeMinutes > 0
              ? `${downtimeMinutes} min lost to stoppages`
              : 'No stoppages booked today'
          }
        />
        <StatTile
          href="/recycling"
          tint="highlight"
          icon={Recycle}
          label="Material yield"
          value={formatPercent(yieldPct, 1)}
          foot={`${formatKg(scrapKg)} back to the grinder`}
        />
        <StatTile
          href="/quality"
          tint={exceptions.length === 0 ? 'success' : 'warning'}
          icon={ClipboardCheck}
          label="Waiting on a decision"
          value={String(exceptions.length)}
          foot={
            exceptions.length === 0
              ? 'Every receipt inspected, every job supplied'
              : 'Batches, job cards and non-conformances'
          }
        />
      </div>

      {/* ------------------------------------------------- what is running now */}
      <Panel>
        <PanelHeader
          title="On the floor now"
          description={`${runningCount} of ${MACHINES.length} machines running${
            downtimeMinutes > 0 ? ` · ${downtimeMinutes} min lost to stoppages` : ''
          }`}
          action={
            <Badge tone={runningCount > 0 ? 'success' : 'muted'}>
              {formatNumber(producedPcs)} pcs produced
            </Badge>
          }
        />
        <PanelBody>
          <ul className="grid gap-2 lg:grid-cols-2">
            {machines.map(({ machine, running, order, job, downtime }) => {
              const isRunning = machine.status === 'RUNNING'
              return (
                <li
                  key={machine.machineId}
                  className="rounded-xl border border-bd-default px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        isRunning
                          ? 'h-2 w-2 shrink-0 rounded-full bg-success'
                          : machine.status === 'MAINTENANCE'
                            ? 'h-2 w-2 shrink-0 rounded-full bg-warning'
                            : 'h-2 w-2 shrink-0 rounded-full bg-fg-subtle'
                      }
                    />
                    <span className="font-mono text-sm font-semibold">{machine.machineCode}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">
                      {machine.machineName}
                    </span>
                    <Badge
                      tone={isRunning ? 'success' : machine.status === 'MAINTENANCE' ? 'warning' : 'muted'}
                    >
                      {isRunning ? 'Running' : machine.status === 'MAINTENANCE' ? 'Maintenance' : 'Idle'}
                    </Badge>
                  </div>

                  {order && job ? (
                    <div className="mt-2">
                      <Meter
                        value={order.producedQty}
                        max={Math.max(order.targetQty, order.producedQty)}
                        label={
                          <>
                            {!isRunning ? <span className="text-fg-subtle">Last run · </span> : null}
                            <span className="font-mono">{job.jobCardNo}</span> · {job.customerName}
                          </>
                        }
                        valueLabel={`${formatNumber(order.producedQty)} / ${formatNumber(order.targetQty)} ${order.unit.toLowerCase()}`}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-fg-subtle">
                      {machine.status === 'MAINTENANCE'
                        ? 'Under maintenance, nothing scheduled'
                        : 'No work order on this machine'}
                    </p>
                  )}

                  {downtime > 0 ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-warning">
                      <Wrench className="h-3 w-3 shrink-0" />
                      {downtime} min stopped
                      {running?.downtimeReason ? ` · ${running.downtimeReason}` : ''}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </PanelBody>
      </Panel>

      {/* ------------------------------------------------- what is planned today */}
      <Panel>
        <PanelHeader
          title="Today's schedule"
          description="What planning put on each machine for this date, in queue order"
          action={
            <Badge tone={todaySlots.length > 0 ? 'info' : 'muted'}>
              {todaySlots.length} {plural(todaySlots.length, 'slot', 'slots')}
            </Badge>
          }
        />
        <PanelBody>
          {todaySlots.length === 0 ? (
            <p className="text-sm text-fg-muted">Nothing is scheduled against today's date.</p>
          ) : (
            <ul className="grid gap-2 lg:grid-cols-2">
              {todaySlots.map((slot) => {
                const job = JOB_CARDS.find((j) => j.jobCardNo === slot.jobCardNo)
                const state = slot.completedAt ? 'Completed' : slot.startedAt ? 'Running' : 'Queued'
                return (
                  <li
                    key={slot.slotId}
                    className="flex flex-wrap items-center gap-2.5 rounded-xl border border-bd-default px-3 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-subtle font-mono text-2xs font-semibold">
                      {slot.sequenceNo}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        <span className="font-mono font-semibold">{slot.machineCode}</span>
                        <span className="ml-2 font-mono text-xs text-fg-muted">{slot.jobCardNo}</span>
                      </span>
                      <span className="block truncate text-xs text-fg-muted">
                        {job?.customerName ?? 'Job card not found'} · shift {slot.shift} ·{' '}
                        {formatNumber(slot.plannedQty)} planned
                      </span>
                    </span>
                    <Badge
                      tone={state === 'Completed' ? 'success' : state === 'Running' ? 'info' : 'muted'}
                    >
                      {state}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </PanelBody>
      </Panel>

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        {/* --------------------------------------------- what needs a person */}
        <Panel>
          <PanelHeader
            title="Needs someone today"
            description="Everything holding work up, in the order it stops the plant"
            action={
              exceptions.length === 0 ? (
                <Badge tone="success">Nothing waiting</Badge>
              ) : (
                <Badge tone="warning">{exceptions.length} to clear</Badge>
              )
            }
          />
          <PanelBody>
            {exceptions.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Nothing is waiting on a decision. Every receipt is inspected, every job has its
                material, and no non-conformance is open.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {exceptions.map((item) => (
                  <li key={`${item.href}-${item.title}`}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-md border border-bd-default px-3 py-2 transition-colors hover:border-bd-strong hover:bg-bg-hover"
                    >
                      <item.icon
                        className={
                          item.tone === 'error'
                            ? 'h-4 w-4 shrink-0 text-error'
                            : 'h-4 w-4 shrink-0 text-warning'
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-sm">
                          <span className="font-mono font-semibold">{item.count}</span> {item.title}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">{item.detail}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        {/* ------------------------------------------------- output and yield */}
        <Panel>
          <PanelHeader
            title="Output against the order book"
            description="Pieces off the presses against what the job cards committed"
          />
          <PanelBody>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums">
                {formatNumber(producedPcs)}
              </span>
              <span className="text-sm text-fg-muted">
                of {formatNumber(targetPcs)} pieces on live job cards
              </span>
            </div>
            <div className="mt-2">
              <Meter
                value={producedPcs}
                max={Math.max(targetPcs, producedPcs)}
                size="md"
                valueLabel={formatPercent(targetPcs > 0 ? (producedPcs / targetPcs) * 100 : 0, 0)}
              />
            </div>

            <Divider />

            <div className="space-y-3">
              <Meter
                label="Material yield, cut against consumed"
                valueLabel={formatPercent(yieldPct, 1)}
                value={yieldPct}
                max={100}
                tone={yieldPct >= 85 ? 'success' : 'warning'}
              />
              <div className="grid grid-cols-3 gap-3">
                <Figure label="Consumed" value={formatKg(consumedKg)} />
                <Figure label="Scrap to regrind" value={formatKg(scrapKg)} tone="warning" />
                <Figure label="Rejected at sorting" value={`${formatNumber(rejectedPcs)} pcs`} tone="warning" />
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        {/* -------------------------------------------------- work in progress */}
        <Panel>
          <PanelHeader
            title="Where the work is sitting"
            description="Job cards by the stage they are waiting at"
            action={
              finished > 0 ? <Badge tone="success">{finished} through packing</Badge> : undefined
            }
          />
          <PanelBody>
            <StageColumns steps={stageCounts} />
            <p className="mt-3 text-xs text-fg-muted">
              A job counts at the first stage it has not finished, so a card sitting at cutting has
              already been formed. Amber marks a stage where something is blocked.
            </p>
          </PanelBody>
        </Panel>

        {/* ------------------------------------------------- material position */}
        <Panel>
          <PanelHeader
            title="Material position"
            description="What incoming QC did with everything received"
          />
          <PanelBody>
            {/* Three states, three rows. They are never stacked into one bar:
                the plant's green, amber and red are too close to separate for a
                colourblind reader when they touch. */}
            <div className="space-y-3">
              <Meter
                label="Approved into stock"
                valueLabel={formatKg(approvedKg)}
                value={approvedKg}
                max={materialPeak}
                tone="success"
                size="md"
              />
              <Meter
                label="On hold, awaiting a supplier decision"
                valueLabel={formatKg(held)}
                value={held}
                max={materialPeak}
                tone="warning"
                size="md"
              />
              <Meter
                label="Rejected, going back"
                valueLabel={formatKg(returned)}
                value={returned}
                max={materialPeak}
                tone="error"
                size="md"
              />
            </div>
            <Divider />
            <p className="text-xs text-fg-muted">
              Only the approved quantity can be issued to a job card. Held and rejected material was
              paid for but cannot be formed, which is what makes it worth watching.
            </p>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Pieces cut, day by day"
            description="Off the presses, on the days the floor posted"
          />
          <PanelBody>
            <StageColumns steps={perDay} format={(n) => formatNumber(n)} />
            <p className="mt-3 text-xs text-fg-muted">
              Presses only. Forming is counted in sheets and cutting in pieces, and two units never
              share one scale — the forming figure is on the machine wall above.
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Minutes lost to stoppages"
            description="Machine time that produced nothing"
            action={
              downtimeMinutes > 0 ? (
                <Badge tone="warning">{downtimeMinutes} min</Badge>
              ) : (
                <Badge tone="success">None today</Badge>
              )
            }
          />
          <PanelBody>
            <StageColumns steps={stoppages} format={(n) => (n === 0 ? '—' : `${n}`)} />
            <p className="mt-3 text-xs text-fg-muted">
              Every stoppage on this chart is booked against a reason on the production entry, so a
              tall column can be traced to what caused it.
            </p>
          </PanelBody>
        </Panel>
      </div>

      {/* --------------------------------------------------------- deliveries */}
      <Panel>
        <PanelHeader
          title="Deliveries not yet made"
          description={`Against the plant's own date, ${today}`}
          action={
            deliveries.some((d) => d.daysLeft <= 7) ? (
              <Badge tone="warning">
                {deliveries.filter((d) => d.daysLeft <= 7).length} inside a week
              </Badge>
            ) : undefined
          }
        />
        <PanelBody>
          {deliveries.length === 0 ? (
            <p className="text-sm text-fg-muted">Every ordered quantity has been produced.</p>
          ) : (
            <ul className="space-y-1.5">
              {deliveries.map((d) => (
                <li
                  key={d.key}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-bd-default px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-sm font-semibold">{d.soNumber}</span>
                    <span className="ml-2 text-sm">{d.customerName}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      <span className="font-mono">{d.artworkCode}</span>
                      {d.jobCardNo ? (
                        <>
                          {' · '}
                          <span className="font-mono">{d.jobCardNo}</span>
                        </>
                      ) : (
                        ' · no job card raised yet'
                      )}
                    </span>
                  </span>

                  <span className="w-40 shrink-0 text-right">
                    {d.made === 0 ? (
                      <span className="font-mono text-xs text-fg-subtle">
                        {formatNumber(d.ordered)} to make
                      </span>
                    ) : (
                      <Meter
                        value={d.made}
                        max={d.ordered}
                        valueLabel={`${formatNumber(d.made)} / ${formatNumber(d.ordered)}`}
                      />
                    )}
                  </span>

                  <span className="shrink-0">
                    {d.daysLeft < 0 ? (
                      <Badge tone="error">{Math.abs(d.daysLeft)} days late</Badge>
                    ) : d.daysLeft <= 7 ? (
                      <Badge tone="warning">{d.daysLeft} days left</Badge>
                    ) : (
                      <Badge tone="muted">{d.daysLeft} days left</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>

      <Note>
        Every figure here is read off the records the floor posts — work orders, receipts,
        inspections and issues. Nothing on this screen is entered against it, so a number that looks
        wrong is a record that needs correcting rather than a dashboard that needs adjusting.
      </Note>
    </>
  )
}

/** One derived number with its name under it. */
function Figure({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'warning'
}) {
  return (
    <div className="rounded-md border border-bd-default px-2.5 py-2">
      <p className={tone === 'warning' ? 'font-mono text-sm font-semibold text-warning' : 'font-mono text-sm font-semibold'}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-2xs text-fg-muted" title={label}>
        {label}
      </p>
    </div>
  )
}
