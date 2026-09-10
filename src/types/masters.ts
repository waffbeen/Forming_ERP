/* Master data types.

   Column names follow the Indas Estimo master conventions (code + name +
   status, with createdBy / createdDate audit fields) so the two products'
   master screens read the same, with thermoforming specifics added on top. */

import type { MaterialType } from './index'

export type MasterStatus = 'ACTIVE' | 'INACTIVE'

/** Audit fields every master carries. */
export interface MasterBase {
  status: MasterStatus
  createdBy: string
  createdDate: string
}

// ------------------------------------------------------------------ Supplier

export interface Supplier extends MasterBase {
  supplierId: string
  supplierCode: string
  supplierName: string
  city: string
  gstin: string
  contactPerson: string
  contactNo: string
  /** Polymers this supplier is approved to deliver. */
  materialsSupplied: MaterialType[]
  leadTimeDays: number
  paymentTerms: string
  /** Share of GRN lines from this supplier that passed IQC first time. */
  qualityRatingPct: number
}

// ------------------------------------------------------------------ Category

export type CategoryAppliesTo = 'ITEM' | 'PRODUCT' | 'BOTH'

export interface Category extends MasterBase {
  categoryId: string
  categoryCode: string
  categoryName: string
  /** Null for a top-level category. */
  parentCategoryId: string | null
  appliesTo: CategoryAppliesTo
  description: string
}

// ---------------------------------------------------------------------- Item

export type ItemType = 'RAW_MATERIAL' | 'CONSUMABLE' | 'PACKING' | 'SPARE'

export interface Item extends MasterBase {
  itemId: string
  itemCode: string
  itemName: string
  itemType: ItemType
  categoryId: string
  /** Everything the plant buys is stocked in one of these. */
  uom: 'KG' | 'NOS' | 'MTR' | 'LTR' | 'BOX'
  defaultSupplierId: string | null
  defaultBinId: string | null
  reorderLevel: number
  ratePerUom: number
  hsnCode: string
  /**
   * Reel specification, on the raw material items that are reels. A roll's
   * polymer and deckle belong to what was ordered, not to the roll, so the
   * receipt does not have to be told them again.
   */
  materialType?: MaterialType
  deckleWidthMm?: number
}

// ------------------------------------------------------------------- Product

/**
 * A finished tray design that has actually been produced.
 *
 * The first completed job card for an artwork creates the product, capturing
 * the specification and achieved cost as they came out of that run. A repeat
 * order for the same artwork reuses the product instead of re-deriving any of
 * it, so the second order is quoted from what the plant actually achieved
 * rather than from an estimate.
 */
export interface Product extends MasterBase {
  productId: string
  productCode: string
  productName: string
  artworkCode: string
  customerId: string
  customerName: string
  categoryId: string
  materialType: MaterialType
  thicknessMicrons: number
  /** Specification snapshot taken when the product was created. */
  cavityUpsPerSheet: number
  weightPerPieceG: number
  standardCostPerPc: number
  /** Provenance: which job card first produced it, and how often since. */
  originJobCardNo: string
  timesProduced: number
  totalPiecesProduced: number
  lastProducedOn: string
  /** Generic trays held against demand; everything else is made to order. */
  isSafetyStock: boolean
  safetyStockQty: number
  currentStockQty: number
}

// ------------------------------------------------------------------- Process

export type ProcessStage = 'FORMING' | 'CUTTING' | 'SORTING' | 'PACKING' | 'QC' | 'DISPATCH' | 'RECYCLING'

export interface Process extends MasterBase {
  processId: string
  processCode: string
  processName: string
  stage: ProcessStage
  department: string
  /** Which machine type runs it, if any. */
  machineType: 'FORMING' | 'CUTTING' | 'NONE'
  /** Costing basis for the conversion charge. */
  typeOfCharges: 'PER_PIECE' | 'PER_SHEET' | 'PER_HOUR'
  rate: number
  minimumCharges: number
  setupCharges: number
  /** Unit the process consumes, and the unit it produces. */
  startUnit: 'KG' | 'SHEET' | 'PIECE' | 'BOX'
  endUnit: 'KG' | 'SHEET' | 'PIECE' | 'BOX'
  standardTimeMins: number
  processWastePercent: number
  toolRequired: boolean
  /** Whether QC must clear the line before this process may start. */
  requiresLineClearance: boolean
  requiresFpa: boolean
  sequenceNo: number
}

// ----------------------------------------------------------- Warehouse & bins

export type BinType =
  | 'QC_APPROVED'
  | 'QUARANTINE'
  | 'REJECTED'
  | 'FINISHED_GOODS'
  | 'SCRAP'
  | 'GENERAL'

export interface Warehouse extends MasterBase {
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  location: string
  binCount: number
}

export interface Bin extends MasterBase {
  binId: string
  binCode: string
  binName: string
  warehouseId: string
  binType: BinType
  /** Capacity and occupancy in kilograms, the unit the store works in. */
  capacityKg: number
  occupiedKg: number
}

// ---------------------------------------------------------------------- User

export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'QC' | 'STORE' | 'ACCOUNTS'

export interface User extends MasterBase {
  userId: string
  userCode: string
  userName: string
  loginUserName: string
  email: string
  contactNo: string
  designation: string
  role: UserRole
  branch: string
  productionUnit: string
  isAdmin: boolean
  lastLoginAt: string | null
  mustResetPassword: boolean
}

// ------------------------------------------------------------------ Employee

/**
 * Every employee is a user first. The user record carries the login, the role
 * and the contact details; the employee record carries what the shop floor
 * needs. A signature on a checklist therefore always traces back to a login.
 */
export interface Employee extends MasterBase {
  employeeId: string
  employeeCode: string
  /** Always points at a User. There are no employees without a login. */
  userId: string
  department: 'Production' | 'Quality' | 'Stores' | 'Dispatch' | 'Planning' | 'Administration'
  shift: 'A' | 'B' | 'General'
  dateOfJoining: string
  /** Machines and checks this person is signed off to perform. */
  certifiedFor: string[]
  reportsToEmployeeId: string | null
}

// -------------------------------------------------------------------- Module

export interface ModulePermission {
  view: boolean
  create: boolean
  edit: boolean
  approve: boolean
}

export type PermissionKey = keyof ModulePermission

export interface AppModule extends MasterBase {
  moduleId: string
  moduleCode: string
  moduleName: string
  /** Route the module owns, matching the sidebar. */
  route: string
  moduleGroup: string
  /** Default permission granted to each role. */
  rolePermissions: Record<UserRole, ModulePermission>
  enabled: boolean
}

// -------------------------------------------------------------------- Prefix

export type DocumentKind =
  | 'SALES_ORDER'
  | 'JOB_CARD'
  | 'GRN'
  | 'INVOICE'
  | 'DELIVERY_NOTE'
  | 'COA'
  | 'RECYCLING_NOTE'
  | 'ARTWORK'
  | 'PRODUCT'
  | 'GATE_PASS'

/**
 * Numbering rules per document type. The running number resets each financial
 * year, which is why the year is part of the record rather than baked into the
 * prefix text.
 */
export interface DocumentPrefix extends MasterBase {
  prefixId: string
  documentKind: DocumentKind
  documentName: string
  prefix: string
  /** Indian financial year, e.g. "2026-27". */
  financialYear: string
  /** Optional segment between prefix and number. */
  separator: string
  padding: number
  currentNumber: number
  resetsAnnually: boolean
}

/** Renders the next number a prefix rule would issue. */
export function formatDocumentNumber(p: DocumentPrefix, next = p.currentNumber + 1) {
  const year = p.financialYear.replace('-', '')
  return `${p.prefix}${p.separator}${year}${p.separator}${String(next).padStart(p.padding, '0')}`
}
