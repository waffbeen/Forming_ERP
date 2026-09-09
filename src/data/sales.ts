import type { Estimation, SalesEnquiry } from '@/types'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { MATERIALS } from './masters'

/* ============================================================
   Enquiry to order.

   An enquiry is what the customer asked for, in their words and their
   quantity. An estimation is what the plant can do it for, costed from
   the open layout by the same engine the job card uses. Neither is an
   order until somebody accepts a rate.
   ============================================================ */

export const SALES_ENQUIRIES: SalesEnquiry[] = [
  {
    enquiryId: 'E01', enquiryNo: 'ENQ-2609-0042', enquiryDate: '2026-09-08',
    customerId: 'C02', customerName: 'Cipla Ltd', contactPerson: 'Rohan Deshpande',
    productDescription: 'Blister base tray, amber, 500 µm for a new SKU',
    artworkCode: 'AW-PVC-0288',
    materialType: 'PVC', thicknessMicrons: 500,
    openLengthMm: 148, openWidthMm: 118, depthMm: 18,
    expectedQtyPcs: 120000, targetRatePerPc: 3.6, requiredBy: '2026-10-20',
    source: 'EMAIL', status: 'ESTIMATED',
    remarks: 'Same footprint as AW-PVC-0288 but a heavier gauge',
  },
  {
    enquiryId: 'E02', enquiryNo: 'ENQ-2609-0041', enquiryDate: '2026-09-07',
    customerId: null, customerName: 'Sahyadri Foods', contactPerson: 'Meghana Kulkarni',
    productDescription: 'Four-compartment meal tray, HIPS white',
    artworkCode: null,
    materialType: 'HIPS', thicknessMicrons: 350,
    openLengthMm: 232, openWidthMm: 176, depthMm: 32,
    expectedQtyPcs: 250000, targetRatePerPc: null, requiredBy: '2026-11-15',
    source: 'PLANT_VISIT', status: 'ESTIMATED',
    remarks: 'Prospect. Wants a sample tray before committing',
  },
  {
    enquiryId: 'E03', enquiryNo: 'ENQ-2609-0040', enquiryDate: '2026-09-05',
    customerId: 'C04', customerName: 'Himalaya Wellness', contactPerson: 'Anup Nair',
    productDescription: 'Cream jar insert, six cavity instead of four',
    artworkCode: 'AW-PET-0219',
    materialType: 'PET', thicknessMicrons: 250,
    openLengthMm: 168, openWidthMm: 96, depthMm: 21,
    expectedQtyPcs: 40000, targetRatePerPc: 2.4, requiredBy: '2026-10-08',
    source: 'PHONE', status: 'OPEN',
    remarks: 'Drawing revision awaited before it can be costed',
  },
  {
    enquiryId: 'E04', enquiryNo: 'ENQ-2609-0039', enquiryDate: '2026-09-04',
    customerId: 'C06', customerName: 'Parle Products', contactPerson: 'Sameer Joshi',
    productDescription: 'Biscuit insert tray, repeat of the running design',
    artworkCode: 'AW-PP-0067',
    materialType: 'PP', thicknessMicrons: 400,
    openLengthMm: 165, openWidthMm: 128, depthMm: 16,
    expectedQtyPcs: 75000, targetRatePerPc: 2.65, requiredBy: '2026-09-30',
    source: 'EMAIL', status: 'CONVERTED',
    remarks: 'Costing already on file from the last run',
  },
  {
    enquiryId: 'E05', enquiryNo: 'ENQ-2609-0037', enquiryDate: '2026-09-02',
    customerId: 'C07', customerName: 'Emami Ltd', contactPerson: 'Priyanka Ghosh',
    productDescription: 'Cosmetic pallet, green, 600 µm',
    artworkCode: 'AW-PET-0201',
    materialType: 'PET', thicknessMicrons: 600,
    openLengthMm: 178, openWidthMm: 138, depthMm: 30,
    expectedQtyPcs: 12000, targetRatePerPc: 8.5, requiredBy: '2026-09-19',
    source: 'REFERRAL', status: 'CONVERTED',
    remarks: 'Quoted above target, accepted on lead time',
  },
  {
    enquiryId: 'E06', enquiryNo: 'ENQ-2608-0031', enquiryDate: '2026-08-26',
    customerId: null, customerName: 'Konkan Marine Exports', contactPerson: 'Deepak Shetty',
    productDescription: 'Deep-draw fish pack, 900 µm PET',
    artworkCode: null,
    materialType: 'PET', thicknessMicrons: 900,
    openLengthMm: 264, openWidthMm: 198, depthMm: 78,
    expectedQtyPcs: 60000, targetRatePerPc: 9.0, requiredBy: '2026-10-01',
    source: 'REFERRAL', status: 'LOST',
    remarks: 'Draw ratio beyond the 600 mm bed; declined at estimation',
  },
]

/* ------------------------------------------------------------------ */

/** Commercial inputs to an offer. Everything else is worked out. */
interface EstimationPlan {
  estimationId: string
  estimationNo: string
  estimationDate: string
  enquiryNo: string | null
  customerId: string | null
  customerName: string
  artworkCode: string | null
  productDescription: string
  materialType: Estimation['materialType']
  thicknessMicrons: number
  openLengthMm: number
  openWidthMm: number
  quantityPcs: number
  conversionRatePerPc: number
  marginPercent: number
  validUntil: string
  status: Estimation['status']
  preparedBy: string
}

const ESTIMATION_PLANS: EstimationPlan[] = [
  {
    estimationId: 'Q01', estimationNo: 'EST-2609-0028', estimationDate: '2026-09-08',
    enquiryNo: 'ENQ-2609-0042', customerId: 'C02', customerName: 'Cipla Ltd',
    artworkCode: 'AW-PVC-0288', productDescription: 'Blister base tray, amber, 500 µm',
    materialType: 'PVC', thicknessMicrons: 500, openLengthMm: 148, openWidthMm: 118,
    quantityPcs: 120000, conversionRatePerPc: 0.85, marginPercent: 22,
    validUntil: '2026-10-08', status: 'SENT', preparedBy: 'Yuvraj Bhaigude',
  },
  {
    estimationId: 'Q02', estimationNo: 'EST-2609-0027', estimationDate: '2026-09-07',
    enquiryNo: 'ENQ-2609-0041', customerId: null, customerName: 'Sahyadri Foods',
    artworkCode: null, productDescription: 'Four-compartment meal tray, HIPS white',
    materialType: 'HIPS', thicknessMicrons: 350, openLengthMm: 232, openWidthMm: 176,
    quantityPcs: 250000, conversionRatePerPc: 1.1, marginPercent: 18,
    validUntil: '2026-10-07', status: 'DRAFT', preparedBy: 'Yuvraj Bhaigude',
  },
  {
    estimationId: 'Q03', estimationNo: 'EST-2609-0026', estimationDate: '2026-09-04',
    enquiryNo: 'ENQ-2609-0039', customerId: 'C06', customerName: 'Parle Products',
    artworkCode: 'AW-PP-0067', productDescription: 'Biscuit insert tray',
    materialType: 'PP', thicknessMicrons: 400, openLengthMm: 165, openWidthMm: 128,
    quantityPcs: 75000, conversionRatePerPc: 0.85, marginPercent: 20,
    validUntil: '2026-09-30', status: 'CONVERTED', preparedBy: 'Pooja Gupta',
  },
  {
    estimationId: 'Q04', estimationNo: 'EST-2609-0024', estimationDate: '2026-09-02',
    enquiryNo: 'ENQ-2609-0037', customerId: 'C07', customerName: 'Emami Ltd',
    artworkCode: 'AW-PET-0201', productDescription: 'Cosmetic pallet, green, 600 µm',
    materialType: 'PET', thicknessMicrons: 600, openLengthMm: 178, openWidthMm: 138,
    quantityPcs: 12000, conversionRatePerPc: 1.2, marginPercent: 26,
    validUntil: '2026-09-25', status: 'CONVERTED', preparedBy: 'Pooja Gupta',
  },
  {
    estimationId: 'Q05', estimationNo: 'EST-2608-0021', estimationDate: '2026-08-27',
    enquiryNo: 'ENQ-2608-0031', customerId: null, customerName: 'Konkan Marine Exports',
    artworkCode: null, productDescription: 'Deep-draw fish pack, 900 µm PET',
    materialType: 'PET', thicknessMicrons: 900, openLengthMm: 264, openWidthMm: 198,
    quantityPcs: 60000, conversionRatePerPc: 1.8, marginPercent: 24,
    validUntil: '2026-09-26', status: 'LOST', preparedBy: 'Yuvraj Bhaigude',
  },
  {
    estimationId: 'Q06', estimationNo: 'EST-2609-0029', estimationDate: '2026-09-09',
    enquiryNo: null, customerId: 'C01', customerName: 'Vadilal Industries',
    artworkCode: 'AW-PVC-0312', productDescription: 'Ice cream tray 750 ml, next season volume',
    materialType: 'PVC', thicknessMicrons: 300, openLengthMm: 185, openWidthMm: 142,
    quantityPcs: 200000, conversionRatePerPc: 0.75, marginPercent: 19,
    validUntil: '2026-10-09', status: 'APPROVED', preparedBy: 'Pooja Gupta',
  },
]

const round2 = (n: number) => Number(n.toFixed(2))

/**
 * The offer is priced off the costing engine, not off a typed-in number. A
 * margin is a markup on landed cost, so the rate moves the moment the layout,
 * the gauge or the polymer rate moves and no stale quote can survive.
 */
export const ESTIMATIONS: Estimation[] = ESTIMATION_PLANS.map((plan) => {
  const material = MATERIALS.find((m) => m.materialType === plan.materialType)

  const nesting = calculateNesting({
    openLengthMm: plan.openLengthMm,
    openWidthMm: plan.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  })

  if (!material || nesting.upsPerSheet === 0) {
    // A layout that will not nest on the bed cannot be quoted at all.
    return {
      ...plan,
      upsPerSheet: nesting.upsPerSheet,
      sheetsRequired: 0,
      grossWeightKg: 0,
      costPerPiece: 0,
      offeredRatePerPc: 0,
      orderValue: 0,
    }
  }

  const costing = calculateCosting({
    targetPiecesQty: plan.quantityPcs,
    upsPerSheet: nesting.upsPerSheet,
    utilisation: nesting.utilisation,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
    thicknessMicrons: plan.thicknessMicrons,
    densityGCm3: material.densityGCm3,
    ratePerKg: material.ratePerKg,
    scrapRatePerKg: material.scrapRatePerKg,
    conversionRatePerPc: plan.conversionRatePerPc,
    wastePercent: 2.5,
  })

  const offeredRatePerPc = round2(costing.costPerPiece * (1 + plan.marginPercent / 100))

  return {
    ...plan,
    upsPerSheet: nesting.upsPerSheet,
    sheetsRequired: costing.sheets,
    grossWeightKg: Number(costing.grossWeightKg.toFixed(1)),
    costPerPiece: round2(costing.costPerPiece),
    offeredRatePerPc,
    orderValue: Math.round(offeredRatePerPc * plan.quantityPcs),
  }
})

// ------------------------------------------------------------------ Helpers

/** Estimations a sales order can still be raised against. */
export function quotableEstimations() {
  return ESTIMATIONS.filter((e) => e.status === 'APPROVED' || e.status === 'SENT')
}

/** Enquiries nobody has costed yet. */
export function uncostedEnquiries() {
  return SALES_ENQUIRIES.filter((e) => e.status === 'OPEN')
}

/** Margin actually achieved on a rate, against the estimated landed cost. */
export function marginOn(costPerPiece: number, ratePerPc: number) {
  return ratePerPc > 0 ? ((ratePerPc - costPerPiece) / ratePerPc) * 100 : 0
}
