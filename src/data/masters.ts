import type {
  ArtworkMaster, Customer, Die, Machine, MaterialGrade, Operator, Reel,
} from '@/types'
import { calculateNesting } from '@/lib/layout-calc'
import { DECKLE_MM, PLANT } from '@/config/plant'

export const CUSTOMERS: Customer[] = [
  { customerId: 'C01', customerCode: 'CUS-0012', customerName: 'Vadilal Industries', segment: 'Food', city: 'Ahmedabad', gstin: '24AABCV1234K1ZP', paymentTerms: '45 days', activeArtworks: 6 },
  { customerId: 'C02', customerCode: 'CUS-0018', customerName: 'Cipla Ltd', segment: 'Pharmaceutical', city: 'Mumbai', gstin: '27AAACC1234M1Z8', paymentTerms: '60 days', activeArtworks: 11 },
  { customerId: 'C03', customerCode: 'CUS-0023', customerName: 'Britannia Industries', segment: 'Food', city: 'Bengaluru', gstin: '29AAACB1234E1ZK', paymentTerms: '30 days', activeArtworks: 4 },
  { customerId: 'C04', customerCode: 'CUS-0031', customerName: 'Himalaya Wellness', segment: 'Cosmetics', city: 'Bengaluru', gstin: '29AAACH1234R1ZQ', paymentTerms: '45 days', activeArtworks: 5 },
  { customerId: 'C05', customerCode: 'CUS-0037', customerName: 'Zydus Lifesciences', segment: 'Pharmaceutical', city: 'Ahmedabad', gstin: '24AAACZ1234N1ZD', paymentTerms: '60 days', activeArtworks: 8 },
  { customerId: 'C06', customerCode: 'CUS-0044', customerName: 'Parle Products', segment: 'Food', city: 'Mumbai', gstin: '27AAACP1234L1ZW', paymentTerms: '30 days', activeArtworks: 3 },
  { customerId: 'C07', customerCode: 'CUS-0052', customerName: 'Emami Ltd', segment: 'Cosmetics', city: 'Kolkata', gstin: '19AAACE1234B1ZF', paymentTerms: '45 days', activeArtworks: 2 },
  { customerId: 'C08', customerCode: 'CUS-0058', customerName: 'Mother Dairy', segment: 'Food', city: 'Delhi', gstin: '07AAACM1234J1ZR', paymentTerms: '30 days', activeArtworks: 7 },
  { customerId: 'C09', customerCode: 'CUS-0063', customerName: 'Sun Pharmaceutical', segment: 'Pharmaceutical', city: 'Mumbai', gstin: '27AAACS1234T1ZM', paymentTerms: '60 days', activeArtworks: 9 },
]

export const MATERIALS: MaterialGrade[] = [
  { materialId: 'M01', materialType: 'PVC', grade: 'Rigid PVC, pharma grade', densityGCm3: 1.38, minMicrons: 180, maxMicrons: 1000, ratePerKg: 105, scrapRatePerKg: 32, colours: ['Clear', 'Amber'] },
  { materialId: 'M02', materialType: 'PET', grade: 'APET, food contact', densityGCm3: 1.38, minMicrons: 200, maxMicrons: 800, ratePerKg: 128, scrapRatePerKg: 46, colours: ['Clear', 'Green'] },
  { materialId: 'M03', materialType: 'HIPS', grade: 'HIPS, white opaque', densityGCm3: 1.05, minMicrons: 250, maxMicrons: 1000, ratePerKg: 118, scrapRatePerKg: 38, colours: ['White'] },
  { materialId: 'M04', materialType: 'PP', grade: 'PP homopolymer', densityGCm3: 0.91, minMicrons: 300, maxMicrons: 1000, ratePerKg: 134, scrapRatePerKg: 41, colours: ['Clear', 'White'] },
]

const ARTWORK_SPECS: Omit<ArtworkMaster, 'cavityUpsPerSheet'>[] = [
  { artworkId: 'A01', artworkCode: 'AW-PVC-0312', customerId: 'C01', customerName: 'Vadilal Industries', clientProductRef: 'Ice cream tray 750 ml', trayType: 'TRANSPARENT', materialType: 'PVC', thicknessMicrons: 300, openLengthMm: 185, openWidthMm: 142, depthMm: 28, drawingRef: 'DWG/VAD/0312-R3', approved: true },
  { artworkId: 'A02', artworkCode: 'AW-PVC-0288', customerId: 'C02', customerName: 'Cipla Ltd', clientProductRef: 'Blister base tray, amber', trayType: 'AMBER', materialType: 'PVC', thicknessMicrons: 450, openLengthMm: 148, openWidthMm: 118, depthMm: 18, drawingRef: 'DWG/CIP/0288-R2', approved: true },
  { artworkId: 'A03', artworkCode: 'AW-HIP-0104', customerId: 'C03', customerName: 'Britannia Industries', clientProductRef: 'Bakery folding tray', trayType: 'HIPS_WHITE', materialType: 'HIPS', thicknessMicrons: 350, openLengthMm: 196, openWidthMm: 145, depthMm: 24, drawingRef: 'DWG/BRI/0104-R1', approved: true },
  { artworkId: 'A04', artworkCode: 'AW-PET-0219', customerId: 'C04', customerName: 'Himalaya Wellness', clientProductRef: 'Cream jar insert, 4-cavity', trayType: 'TRANSPARENT', materialType: 'PET', thicknessMicrons: 250, openLengthMm: 122, openWidthMm: 96, depthMm: 21, drawingRef: 'DWG/HIM/0219-R4', approved: false },
  { artworkId: 'A05', artworkCode: 'AW-PVC-0295', customerId: 'C05', customerName: 'Zydus Lifesciences', clientProductRef: 'Vial holder tray, 10-up', trayType: 'TRANSPARENT', materialType: 'PVC', thicknessMicrons: 500, openLengthMm: 210, openWidthMm: 168, depthMm: 34, drawingRef: 'DWG/ZYD/0295-R2', approved: true },
  { artworkId: 'A06', artworkCode: 'AW-PP-0067', customerId: 'C06', customerName: 'Parle Products', clientProductRef: 'Biscuit insert tray', trayType: 'TRANSPARENT', materialType: 'PP', thicknessMicrons: 400, openLengthMm: 165, openWidthMm: 128, depthMm: 16, drawingRef: 'DWG/PAR/0067-R1', approved: true },
  { artworkId: 'A07', artworkCode: 'AW-PET-0201', customerId: 'C07', customerName: 'Emami Ltd', clientProductRef: 'Cosmetic pallet, green', trayType: 'GREEN', materialType: 'PET', thicknessMicrons: 600, openLengthMm: 178, openWidthMm: 138, depthMm: 30, drawingRef: 'DWG/EMA/0201-R2', approved: false },
  { artworkId: 'A08', artworkCode: 'AW-HIP-0098', customerId: 'C08', customerName: 'Mother Dairy', clientProductRef: 'Ice cream cup liner', trayType: 'HIPS_WHITE', materialType: 'HIPS', thicknessMicrons: 280, openLengthMm: 112, openWidthMm: 88, depthMm: 42, drawingRef: 'DWG/MOD/0098-R5', approved: true },
]

/**
 * Cavity ups is a property of the layout, not a number anyone types. Deriving
 * it here means the artwork master, the costing and the nesting drawing can
 * never disagree about how many trays fit on a sheet.
 */
export const ARTWORKS: ArtworkMaster[] = ARTWORK_SPECS.map((spec) => ({
  ...spec,
  cavityUpsPerSheet: calculateNesting({
    openLengthMm: spec.openLengthMm,
    openWidthMm: spec.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  }).upsPerSheet,
}))

export const REELS: Reel[] = [
  { reelId: 'RL-9241', grnNumber: 'GRN-2609-0188', materialType: 'PVC', thicknessMicrons: 301, deckleWidthMm: 620, grossWeightKg: 340.0, netWeightKg: 16.0, qcStatus: 'APPROVED', storageLocation: 'QC Approved, Rack A2', receivedOn: '2026-09-04', supplier: 'Supreme Polymers' },
  { reelId: 'RL-9244', grnNumber: 'GRN-2609-0191', materialType: 'HIPS', thicknessMicrons: 348, deckleWidthMm: 620, grossWeightKg: 480.0, netWeightKg: 212.4, qcStatus: 'APPROVED', storageLocation: 'QC Approved, Rack A3', receivedOn: '2026-09-05', supplier: 'Kaira Extrusions' },
  { reelId: 'RL-9247', grnNumber: 'GRN-2609-0194', materialType: 'PET', thicknessMicrons: 243, deckleWidthMm: 600, grossWeightKg: 295.0, netWeightKg: 295.0, qcStatus: 'QUARANTINE', storageLocation: 'Hold Bin H1', receivedOn: '2026-09-07', supplier: 'Nova Films' },
  { reelId: 'RL-9248', grnNumber: 'GRN-2609-0195', materialType: 'PP', thicknessMicrons: 176, deckleWidthMm: 620, grossWeightKg: 260.0, netWeightKg: 260.0, qcStatus: 'REJECTED', storageLocation: 'Rejected Area R1', receivedOn: '2026-09-07', supplier: 'Nova Films' },
  { reelId: 'RL-9251', grnNumber: 'GRN-2609-0199', materialType: 'PVC', thicknessMicrons: 452, deckleWidthMm: 640, grossWeightKg: 520.0, netWeightKg: 520.0, qcStatus: 'APPROVED', storageLocation: 'QC Approved, Rack B1', receivedOn: '2026-09-08', supplier: 'Supreme Polymers' },
  { reelId: 'RL-9253', grnNumber: 'GRN-2609-0201', materialType: 'HIPS', thicknessMicrons: 279, deckleWidthMm: 620, grossWeightKg: 610.0, netWeightKg: 74.9, qcStatus: 'APPROVED', storageLocation: 'QC Approved, Rack A1', receivedOn: '2026-09-08', supplier: 'Kaira Extrusions' },
  { reelId: 'RL-9256', grnNumber: 'GRN-2609-0204', materialType: 'PP', thicknessMicrons: 401, deckleWidthMm: 620, grossWeightKg: 900.0, netWeightKg: 34.7, qcStatus: 'APPROVED', storageLocation: 'QC Approved, Rack B2', receivedOn: '2026-09-09', supplier: 'Gujarat Polyfilms' },
  { reelId: 'RL-9258', grnNumber: 'GRN-2609-0206', materialType: 'PET', thicknessMicrons: 598, deckleWidthMm: 600, grossWeightKg: 380.0, netWeightKg: 380.0, qcStatus: 'QUARANTINE', storageLocation: 'Hold Bin H2', receivedOn: '2026-09-09', supplier: 'Nova Films' },
]

export const MACHINES: Machine[] = [
  { machineId: 'MC1', machineCode: 'TF-01', machineName: 'Forming Line 1', type: 'FORMING', bedLengthMm: 600, bedWidthMm: 600, sheetsPerStroke: 1, strokesPerMin: 18, status: 'RUNNING' },
  { machineId: 'MC2', machineCode: 'TF-02', machineName: 'Forming Line 2', type: 'FORMING', bedLengthMm: 600, bedWidthMm: 600, sheetsPerStroke: 1, strokesPerMin: 16, status: 'IDLE' },
  { machineId: 'MC3', machineCode: 'TF-03', machineName: 'Forming Line 3, deep draw', type: 'FORMING', bedLengthMm: 600, bedWidthMm: 600, sheetsPerStroke: 1, strokesPerMin: 12, status: 'MAINTENANCE' },
  { machineId: 'MC4', machineCode: 'PN-01', machineName: 'Cutting Press 1', type: 'CUTTING', bedLengthMm: 640, bedWidthMm: 640, sheetsPerStroke: 12, strokesPerMin: 24, status: 'RUNNING' },
  { machineId: 'MC5', machineCode: 'PN-02', machineName: 'Cutting Press 2', type: 'CUTTING', bedLengthMm: 640, bedWidthMm: 640, sheetsPerStroke: 12, strokesPerMin: 27, status: 'RUNNING' },
]

export const DIES: Die[] = [
  { dieId: 'D01', dieCode: 'FD-0312', artworkCode: 'AW-PVC-0312', type: 'FORMING', cavities: 12, lastServicedOn: '2026-08-14', strokesSinceService: 41820, serviceDueAt: 50000, location: 'Tool Room, Bay 2' },
  { dieId: 'D02', dieCode: 'PD-0312', artworkCode: 'AW-PVC-0312', type: 'CUTTING', cavities: 12, lastServicedOn: '2026-08-14', strokesSinceService: 3610, serviceDueAt: 8000, location: 'PN-02 mounted' },
  { dieId: 'D03', dieCode: 'FD-0288', artworkCode: 'AW-PVC-0288', type: 'FORMING', cavities: 16, lastServicedOn: '2026-07-30', strokesSinceService: 48400, serviceDueAt: 50000, location: 'Tool Room, Bay 1' },
  { dieId: 'D04', dieCode: 'FD-0104', artworkCode: 'AW-HIP-0104', type: 'FORMING', cavities: 12, lastServicedOn: '2026-09-01', strokesSinceService: 12140, serviceDueAt: 50000, location: 'TF-02 mounted' },
  { dieId: 'D05', dieCode: 'PD-0104', artworkCode: 'AW-HIP-0104', type: 'CUTTING', cavities: 12, lastServicedOn: '2026-09-01', strokesSinceService: 1020, serviceDueAt: 8000, location: 'PN-01 mounted' },
  { dieId: 'D06', dieCode: 'FD-0295', artworkCode: 'AW-PVC-0295', type: 'FORMING', cavities: 6, lastServicedOn: '2026-06-22', strokesSinceService: 49950, serviceDueAt: 50000, location: 'Tool Room, Bay 3' },
  { dieId: 'D07', dieCode: 'FD-0098', artworkCode: 'AW-HIP-0098', type: 'FORMING', cavities: 24, lastServicedOn: '2026-08-28', strokesSinceService: 22300, serviceDueAt: 50000, location: 'TF-01 mounted' },
]

export const OPERATORS: Operator[] = [
  { operatorId: 'O01', employeeCode: 'EMP-014', name: 'Sunita Rane', role: 'QC Inspector', shift: 'A', certifiedFor: ['IQC', 'Line clearance', 'First piece'] },
  { operatorId: 'O02', employeeCode: 'EMP-021', name: 'Meera Shinde', role: 'QC Inspector', shift: 'B', certifiedFor: ['In-process', 'FG inspection', 'COA'] },
  { operatorId: 'O03', employeeCode: 'EMP-007', name: 'Anil Kadam', role: 'Operator', shift: 'A', certifiedFor: ['TF-01', 'TF-02'] },
  { operatorId: 'O04', employeeCode: 'EMP-009', name: 'Ramesh Patil', role: 'Operator', shift: 'B', certifiedFor: ['TF-01', 'TF-03'] },
  { operatorId: 'O05', employeeCode: 'EMP-016', name: 'Dattatray More', role: 'Operator', shift: 'A', certifiedFor: ['PN-01', 'PN-02'] },
  { operatorId: 'O06', employeeCode: 'EMP-025', name: 'Kavita Jadhav', role: 'Packer', shift: 'A', certifiedFor: ['Sorting', 'Carton close'] },
  { operatorId: 'O07', employeeCode: 'EMP-003', name: 'Prakash Naik', role: 'Store Keeper', shift: 'General', certifiedFor: ['GRN', 'Reel issue', 'Returns'] },
  { operatorId: 'O08', employeeCode: 'EMP-011', name: 'Tejas Mehta', role: 'Planner', shift: 'General', certifiedFor: ['Scheduling', 'Costing'] },
]
