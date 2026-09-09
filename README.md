# Desform Thermoforming ERP — frontend

Thermoforming ERP for the Vasai plant. Frontend only: every screen runs off typed
mock data in `src/data`, with no backend or auth wired in yet.

## Running it

```
npm install
npm run dev        # http://localhost:3000
npm run build
npm run type-check
```

## Stack

Next.js App Router, React 19, TypeScript, Tailwind. The structure follows the
Indas Estimo (monarch) frontend so the two codebases stay navigable by the same
people: semantic CSS custom properties in `src/styles/tokens.css`, mapped into
Tailwind in `tailwind.config.ts`, consumed by components as `bg-bg-surface`,
`text-fg-muted`, `border-bd-default` and so on.

## Theming

Colour is applied in three cascading layers, all in `src/styles/tokens.css`:

| Layer | Selector | Holds |
| --- | --- | --- |
| Base | `:root` / `.dark` | Neutrals, status colours, radius, shadows |
| Variant | `.theme-<name>` | Primary, accent, sidebar, selected row |
| Variant, dark | `.dark.theme-<name>` | The same set, retuned for a dark ground |

Six variants ship, all classic and low-saturation with nothing fluorescent:
Slate (default), Graphite, Indigo, Forest, Burgundy and Bronze. The picker sits
in the header next to the light/dark toggle, and both choices persist in
`localStorage`. `ThemeScript` applies them before first paint so the page never
flashes the wrong theme.

Neutrals carry no hue from any accent, so every variant sits on the same ground.
Components never name a colour directly: they use `bg-primary`, `text-accent`,
`border-bd-default` and so on, which means adding a seventh variant is a matter
of adding two CSS blocks and one entry in `VARIANTS`.

## Layout

```
src/
  app/
    layout.tsx              root shell, fonts, theme
    (main)/layout.tsx       sidebar + header + content
    (main)/dashboard        plant overview
    (main)/sales-order      order queue, artwork link, auto-costing
    (main)/job-card         job queue, nesting drawing
    (main)/forming          reel issue, counter readings, machine gate
    (main)/punching         sheet input, piece output, scrap
    (main)/quality          line clearance, IQC, hourly checks, COA
    (main)/packing          reconciliation, cartons, dispatch documents
    (main)/recycling        scrap transfer register
    (main)/master/*         sixteen master screens, four groups
  components/
    ui/                     button, badge, panel, tabs, stats, data table
    layout/                 sidebar, header, page header, master page
    forming/                domain pieces (see below)
    providers/              theme
  config/                   navigation, plant constants
  data/                     masters and transactions
  lib/                      utils, layout-calc
  types/                    domain model
```

## The parts worth knowing about

**`src/lib/layout-calc.ts`** is the engine the whole product hangs off. It takes
the 2D expanded open layout of a tray, nests it both ways round on the forming
bed, keeps the better orientation, and converts the result into reel weight in
kilograms and a landed cost per tray. Sales orders and job cards both call it, so
a change to a drawing reprices every open order that uses it. Nothing on those
screens is a hardcoded total.

**`src/components/forming/nesting-diagram.tsx`** draws that nesting result to
scale. Primary-coloured cavities on an accent skeleton ground, dimensioned on
two edges. Both colours come from the active theme.

**`src/components/forming/signature-gate.tsx`** is the GDP gate. Forming and
punching stay locked until line clearance and first-piece approval are signed,
and the signature seals afterwards. This is the thing that failed the last
customer audit on paper checklists, so it is modelled as a hard gate rather than
a checkbox.

**`src/components/layout/master-page.tsx`** is one component all seven master
screens render through. Adding a master means describing its columns.

## Source documents

The plant's own controlled documents drive the screens, and their numbers are in
`src/config/plant.ts` so a record here matches the one an auditor asks for:

| Document | Number | Where it shows up |
| --- | --- | --- |
| In-process QC, forming | DP/QC/F-01 | Quality, in-process defects tab |
| In-process QC, punching | DP/QC/F-02 | Quality, in-process defects tab |
| Production record, forming | DP/PR/F-03 | Forming entry, line clearance and zone chart |
| Production record, punching | DP/PR/F-04 | Punching entry |
| SOP, cutting | DF/PRD/SOP-05 | Punching rules |
| SOP, forming of trays | DF/PRD/SOP-09 | Forming temperatures, FPA rules |

The QC formats list ten named defect parameters per section, checked as FPA plus
up to nine checks across a shift. `DefectChecklist` reproduces that grid shape
deliberately: an auditor reads down a column for one inspection and across a row
to see whether a defect recurs.

Line clearance is six named physical areas signed by both the machine operator
and the production/QC supervisor, not a single tick. The forming record also
logs a 27-zone heater temperature chart, drawn as a profile against the
polymer's forming window because a drifting zone is what causes webbing and
short forming.

Revision 01 of both SOPs, effective 08 September 2026, added the rule that a
power failure mid-job requires a fresh first piece and FPA before production
resumes. The gate copy says so.

**Filename warning:** the two production checklist PDFs the client sent have
swapped names. "Production Process Checklist Forming Process.pdf" contains the
punching format (DP/PR/F-04), and the punching-named file contains the forming
format (DP/PR/F-03). The app follows the content, not the filenames.

## Masters

Sixteen masters, grouped in the sidebar the way the people who maintain them
think about them:

| Group | Masters |
| --- | --- |
| Business | Clients, Suppliers, Categories, Items, Products |
| Production | Artwork, Processes, Material Grades, Machines, Dies & Tools |
| Inventory | Reel Stock, Warehouse & Bins |
| System | Users, Employees, Modules, Document Prefixes |

Column conventions follow Indas Estimo: a code, a name, `status`, and
`createdBy` / `createdDate` audit fields on every record, with the
thermoforming specifics layered on top.

Four of them carry real logic rather than being flat lists:

**Products** are not entered by hand. A tray design becomes a product the first
time a job card for it completes, capturing the specification and the achieved
cost from that run. A repeat order reuses the product instead of re-deriving
anything, so the second quote reflects what the plant actually managed rather
than an estimate. The create modal refuses to make a second product for an
artwork that already has one, and names the existing code instead.

**Employees hang off Users.** There are no employees without a login, because a
line clearance signature has to trace back to an account somebody signed in
with. The employee modal only offers users that are not already linked, and the
Users master shows which accounts have no employee record and therefore cannot
sign anything on the floor.

**Modules** hold the permission matrix: seven roles against view, create, edit
and approve. Approve is separate from edit deliberately, so a QC inspector can
sign off a forming entry without being able to create or change one. Disabling a
module hides it from every role regardless of their permissions.

**Document Prefixes** own the numbering for every document the system issues.
The financial year is a field on the record rather than text inside the prefix,
so a series can reset on 1 April without anyone editing a string. Artwork and
product codes deliberately do not reset, because a repeat order years later has
to find the same record.

The remaining masters carry smaller rules worth knowing: a supplier is only
offered on a GRN for the polymers they are approved for, bins enforce one
segregation bin of each type per warehouse, raw material items are locked to
kilograms, and processes declare the unit they consume and the unit they produce,
which is what lets kilograms convert into sheets and sheets into pieces.

## Domain notes

Everything is bought, issued, consumed and costed in kilograms — never sheets or
square metres. Reels run 180 to 1000 µm and nothing thinner is accepted at the
GRN line. The forming bed is 600 × 600 mm and the presses punch 12 sheets a
stroke, double-sided as 6 + 6. There are no inks, plates or dampening anywhere:
colour comes from the extruder. Skeleton trim and rejected trays are 100 %
recyclable and are booked back against the job that produced them.

## Not built yet

No API layer, no auth, no persistence. Create buttons open a working modal, but
saving discards the form rather than writing anything. Buttons with no modal yet
(Print card, Export, Release gate pass) are present for shape only. Tabs that
would filter server-side data currently switch client-side views.

## Component library

The Modal, Dropdown and DataGrid all come from `indas-ui`, installed from npm.
Three integration points make it sit on this app's theming rather than its own:

1. `globals.css` imports `indas-ui/tokens.css` **before** this app's tokens, so
   the library supplies the full variable set and this app overrides only the
   palette.
2. Tailwind's `content` includes `node_modules/indas-ui/dist`, so the utilities
   its components use are generated.
3. A compatibility block at the end of `tokens.css` maps the names the library
   expects onto this app's. It resolves through `var()`, so every indas-ui
   component follows the selected theme variant.

One collision is worth knowing about: the library treats `accent` as an alias of
primary, whereas this app needed a genuine second colour. That second colour is
named `highlight` here (`bg-highlight`, `text-highlight`) so the two never
overlap. It is what the skeleton ground and scrap callouts use.

The library's DataGrid and modals read React contexts, so the root layout wraps
the app in the library's `GlobalAlertProvider`, `SearchPreferencesProvider`,
`PageTitleProvider` and `LanguageProvider`. Colour still comes from this app's
own ThemeProvider.

Two thin adapters keep call sites stable: `components/ui/data-table.tsx` maps
this app's small `Column` shape onto the grid's TanStack column definitions, and
`components/modals/standard-modal.tsx` wraps the library's StandardModal to add
a disabled save state and a footer note. Swapping the library out later means
editing those two files, not fifteen pages.

Note the library pins `@tanstack/react-table` v8 internally. Do not install
react-table at the top level: v9 changes the column generics and the two do not
typecheck together. The adapter derives its column type from the grid's own
props for exactly this reason.

## Modals

Create and edit screens are modals; the grid stays on the page behind them.
The stack mirrors Indas Estimo: Radix Dialog primitives in
`src/components/modals/Modal.tsx`, wrapped by `StandardModal` which supplies a
fixed header, a scrolling body and a pinned Cancel/Save footer. Below 768 px
every modal goes full-screen with a back arrow, which is how it has to behave on
a shop-floor tablet.

Eleven create modals ship, in `src/components/modals/create/`:

| Modal | Opened from | Notable behaviour |
| --- | --- | --- |
| Sales Order | Sales Orders | Artwork list is filtered to the chosen customer; costing derives live |
| Job Card | Job Cards | Nesting preview beside the form; reel list filtered to approved stock of the right polymer |
| Forming Entry | Forming Entry | Save is blocked until both QC signatures are ticked |
| Punching Entry | Punching Entry | Flags a skeleton weight that drifts from the nesting allowance |
| Customer, Artwork, Material, Reel, Machine, Die, Operator | Masters | Reached through `MasterPage`'s `createModal` prop |

The forms validate against real plant rules rather than just checking for empty
fields: a reel under 180 µm is forced to the rejected bin, a thickness outside
the grade's range is rejected, an order rate below landed cost is flagged, and a
reel that will not cover the run is called out before the job card is released.

Nothing persists. Saving waits half a second and closes, since there is no API
behind it yet.

## Grids

`DataTable` handles every grid. Columns opt into sorting by supplying a
`sortValue`; clicking a header cycles ascending, descending, then back to the
natural order. Search filters across whatever `searchText` returns for a row.
