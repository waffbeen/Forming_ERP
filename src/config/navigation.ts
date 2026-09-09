import {
  Boxes, ClipboardList, Cog, Disc3, FileText, Flame, Hash, IdCard, Layers,
  LayoutDashboard, Package, PackageCheck, Palette, Recycle, Route, ScanBarcode,
  Scissors, ShieldCheck, Stamp, Tags, Truck, Users, Warehouse, SlidersHorizontal,
  ClipboardList as PrIcon, ShoppingCart, PackagePlus, Boxes as StockIcon,
  Gauge, CheckSquare, ListChecks, MessageSquareQuote, Calculator,
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
    title: 'Order to Cash',
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
    title: 'Procurement',
    items: [
      { label: 'Requisitions', href: '/procurement/requisition', icon: PrIcon, badge: '3' },
      { label: 'Purchase Orders', href: '/procurement/purchase-order', icon: ShoppingCart, badge: '5' },
      { label: 'Goods Receipt', href: '/procurement/grn', icon: PackagePlus, badge: '6' },
      { label: 'Inventory', href: '/inventory', icon: StockIcon },
    ],
  },
  {
    title: 'Quality',
    items: [{ label: 'Quality Control', href: '/quality', icon: ShieldCheck, badge: '6' }],
  },
  {
    title: 'Fulfilment',
    items: [
      { label: 'Packing & Dispatch', href: '/packing', icon: PackageCheck, badge: '4' },
      { label: 'Recycling', href: '/recycling', icon: Recycle },
    ],
  },
  {
    title: 'Masters · Business',
    items: [
      { label: 'Clients', href: '/master/client', icon: Users },
      { label: 'Suppliers', href: '/master/supplier', icon: Truck },
      { label: 'Categories', href: '/master/category', icon: Tags },
      { label: 'Items', href: '/master/item', icon: ScanBarcode },
      { label: 'Products', href: '/master/product', icon: Package },
    ],
  },
  {
    title: 'Masters · Production',
    items: [
      { label: 'Artwork', href: '/master/artwork', icon: Palette },
      { label: 'Processes', href: '/master/process', icon: Route },
      { label: 'Material Grades', href: '/master/material', icon: Layers },
      { label: 'Machines', href: '/master/machine', icon: Cog },
      { label: 'Dies & Tools', href: '/master/die', icon: Stamp },
    ],
  },
  {
    title: 'Masters · Inventory',
    items: [
      { label: 'Reel Stock', href: '/master/reel', icon: Disc3 },
      { label: 'Warehouse & Bins', href: '/master/warehouse', icon: Warehouse },
    ],
  },
  {
    title: 'Masters · System',
    items: [
      { label: 'Users', href: '/master/user', icon: IdCard },
      { label: 'Employees', href: '/master/employee', icon: Boxes },
      { label: 'Modules', href: '/master/module', icon: SlidersHorizontal },
      { label: 'Document Prefixes', href: '/master/prefix', icon: Hash },
    ],
  },
]
