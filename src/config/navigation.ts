import {
  Boxes, ClipboardList, Cog, Disc3, FileText, Flame, Hash, IdCard, Layers,
  LayoutDashboard, Package, PackageCheck, Palette, Recycle, Route, ScanBarcode,
  Scissors, ShieldCheck, Stamp, Tags, Truck, Users, Warehouse, SlidersHorizontal,
  ClipboardList as PrIcon, ShoppingCart, PackagePlus, Boxes as StockIcon,
  Gauge, CheckSquare, ListChecks, MessageSquareQuote, Calculator,
  ClipboardCheck, ArrowRightLeft, ShieldAlert, FileCheck2, TriangleAlert, FlaskConical,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    /* Set-up sits at the top because nothing below it works until it is done:
       an item cannot be ordered, inspected or issued before it exists. */
    title: 'Masters',
    items: [
      { label: 'Clients', href: '/master/client', icon: Users },
      { label: 'Suppliers', href: '/master/supplier', icon: Truck },
      { label: 'Categories', href: '/master/category', icon: Tags },
      { label: 'Items', href: '/master/item', icon: ScanBarcode },
      { label: 'Products', href: '/master/product', icon: Package },
      { label: 'Artwork', href: '/master/artwork', icon: Palette },
      { label: 'Processes', href: '/master/process', icon: Route },
      { label: 'Material Grades', href: '/master/material', icon: Layers },
      { label: 'Machines', href: '/master/machine', icon: Cog },
      { label: 'Dies & Tools', href: '/master/die', icon: Stamp },
      { label: 'QC Parameters', href: '/master/item-qc-parameter', icon: FlaskConical },
      { label: 'Reel Stock', href: '/master/reel', icon: Disc3 },
      { label: 'Warehouse & Bins', href: '/master/warehouse', icon: Warehouse },
      { label: 'Users', href: '/master/user', icon: IdCard },
      { label: 'Employees', href: '/master/employee', icon: Boxes },
      { label: 'Modules', href: '/master/module', icon: SlidersHorizontal },
      { label: 'Document Prefixes', href: '/master/prefix', icon: Hash },
    ],
  },
  {
    /* Named for the journey rather than the department: the same enquiry
       becomes an estimate, an order and a job card without changing hands. */
    title: 'Enquiry to Job Card',
    items: [
      { label: 'Sales Enquiries', href: '/sales/enquiry', icon: MessageSquareQuote, badge: '2' },
      { label: 'Estimations', href: '/sales/estimation', icon: Calculator, badge: '3' },
      { label: 'Sales Orders', href: '/sales-order', icon: FileText, badge: '18' },
      { label: 'Job Cards', href: '/job-card', icon: ClipboardList, badge: '11' },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Production Entry', href: '/production/entry', icon: Gauge },
      { label: 'Forming Entry', href: '/forming', icon: Flame, badge: '3' },
      { label: 'Cutting Entry', href: '/cutting', icon: Scissors, badge: '2' },
      { label: 'Sorting Entry', href: '/sorting', icon: ListChecks },
      { label: 'Job Close', href: '/production/close', icon: CheckSquare },
    ],
  },
  {
    /* Buying and holding material, in the order it moves: asked for, ordered,
       received, issued to a job. */
    title: 'Inventory',
    items: [
      { label: 'Requisitions', href: '/procurement/requisition', icon: PrIcon, badge: '3' },
      { label: 'Purchase Orders', href: '/procurement/purchase-order', icon: ShoppingCart, badge: '5' },
      { label: 'Goods Receipt', href: '/procurement/grn', icon: PackagePlus, badge: '6' },
      { label: 'Material Issue', href: '/inventory/material-issue', icon: ArrowRightLeft },
      { label: 'Stock', href: '/inventory', icon: StockIcon },
    ],
  },
  {
    /* One item per check, in the order the material meets them. */
    title: 'Quality',
    items: [
      { label: 'Quality Overview', href: '/quality', icon: ShieldCheck },
      { label: 'RM QC Approval', href: '/quality/rm-qc', icon: ClipboardCheck, badge: '3' },
      { label: 'Line Clearance', href: '/quality/line-clearance', icon: ShieldAlert, badge: '2' },
      { label: 'In-Process Checks', href: '/quality/in-process', icon: Gauge },
      { label: 'FG & COA', href: '/quality/fg-coa', icon: FileCheck2 },
      /* Every gate above raises into this one register. */
      { label: 'Non-Conformance', href: '/quality/nc', icon: TriangleAlert, badge: '2' },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'Packing & Dispatch', href: '/packing', icon: PackageCheck, badge: '4' },
      { label: 'Recycling', href: '/recycling', icon: Recycle },
    ],
  },
]
