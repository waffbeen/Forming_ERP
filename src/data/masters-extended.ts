import type {
  AppModule, Bin, Category, DocumentPrefix, Employee, Item, ModulePermission,
  Process, Product, Supplier, User, UserRole, Warehouse,
} from '@/types/masters'

const BY = 'Tejas Mehta'
const ON = '2026-08-12'

// ------------------------------------------------------------------ Suppliers

export const SUPPLIERS: Supplier[] = [
  { supplierId: 'SP1', supplierCode: 'SUP-0004', supplierName: 'Supreme Polymers', city: 'Vapi', gstin: '24AABCS4411K1ZR', contactPerson: 'Rakesh Shah', contactNo: '+91 98250 41122', materialsSupplied: ['PVC', 'PET'], leadTimeDays: 7, paymentTerms: '30 days', qualityRatingPct: 98.4, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-02' },
  { supplierId: 'SP2', supplierCode: 'SUP-0009', supplierName: 'Kaira Extrusions', city: 'Ahmedabad', gstin: '24AAECK7788M1Z4', contactPerson: 'Nilesh Patel', contactNo: '+91 99786 33410', materialsSupplied: ['HIPS'], leadTimeDays: 10, paymentTerms: '45 days', qualityRatingPct: 96.1, status: 'ACTIVE', createdBy: BY, createdDate: '2024-06-18' },
  { supplierId: 'SP3', supplierCode: 'SUP-0014', supplierName: 'Nova Films', city: 'Silvassa', gstin: '26AADCN2233P1ZQ', contactPerson: 'Imran Qureshi', contactNo: '+91 97690 55218', materialsSupplied: ['PET', 'PP'], leadTimeDays: 5, paymentTerms: '30 days', qualityRatingPct: 81.7, status: 'ACTIVE', createdBy: BY, createdDate: '2025-01-09' },
  { supplierId: 'SP4', supplierCode: 'SUP-0021', supplierName: 'Gujarat Polyfilms', city: 'Rajkot', gstin: '24AAFCG9911L1ZB', contactPerson: 'Bhavna Desai', contactNo: '+91 94270 77003', materialsSupplied: ['PP', 'PVC'], leadTimeDays: 12, paymentTerms: '60 days', qualityRatingPct: 94.8, status: 'ACTIVE', createdBy: BY, createdDate: '2025-03-21' },
  { supplierId: 'SP5', supplierCode: 'SUP-0026', supplierName: 'Ambica Packaging', city: 'Vasai', gstin: '27AAGCA5566N1ZH', contactPerson: 'Suresh Kulkarni', contactNo: '+91 98336 21470', materialsSupplied: [], leadTimeDays: 3, paymentTerms: '15 days', qualityRatingPct: 99.2, status: 'ACTIVE', createdBy: BY, createdDate: '2025-07-04' },
  { supplierId: 'SP6', supplierCode: 'SUP-0030', supplierName: 'Deccan Polymers', city: 'Pune', gstin: '27AAHCD1122R1ZY', contactPerson: 'Ganesh Rao', contactNo: '+91 90280 11934', materialsSupplied: ['HIPS', 'PP'], leadTimeDays: 14, paymentTerms: '45 days', qualityRatingPct: 88.3, status: 'INACTIVE', createdBy: BY, createdDate: '2024-11-30' },
]

// ----------------------------------------------------------------- Categories

export const CATEGORIES: Category[] = [
  { categoryId: 'CT1', categoryCode: 'CAT-RM', categoryName: 'Raw material', parentCategoryId: null, appliesTo: 'ITEM', description: 'Plastic reels bought by weight', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT2', categoryCode: 'CAT-RM-PVC', categoryName: 'PVC reels', parentCategoryId: 'CT1', appliesTo: 'ITEM', description: 'Rigid PVC in clear and amber', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT3', categoryCode: 'CAT-RM-PET', categoryName: 'PET reels', parentCategoryId: 'CT1', appliesTo: 'ITEM', description: 'APET, food contact grade', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT4', categoryCode: 'CAT-PACK', categoryName: 'Packing material', parentCategoryId: null, appliesTo: 'ITEM', description: 'Cartons, liners, tape and labels', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT5', categoryCode: 'CAT-CONS', categoryName: 'Consumables', parentCategoryId: null, appliesTo: 'ITEM', description: 'Cleaning and maintenance supplies', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT6', categoryCode: 'CAT-PHARMA', categoryName: 'Pharma trays', parentCategoryId: null, appliesTo: 'PRODUCT', description: 'Blister bases and vial holders', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT7', categoryCode: 'CAT-FOOD', categoryName: 'Food trays', parentCategoryId: null, appliesTo: 'PRODUCT', description: 'Ice cream, bakery and confectionery', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT8', categoryCode: 'CAT-COSM', categoryName: 'Cosmetic trays', parentCategoryId: null, appliesTo: 'PRODUCT', description: 'Jar inserts and pallets', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { categoryId: 'CT9', categoryCode: 'CAT-SPARE', categoryName: 'Machine spares', parentCategoryId: null, appliesTo: 'ITEM', description: 'Heaters, sensors and belts', status: 'ACTIVE', createdBy: BY, createdDate: ON },
]

// ---------------------------------------------------------------------- Items

export const ITEMS: Item[] = [
  { itemId: 'IT1', itemCode: 'RM-PVC-300C', itemName: 'PVC reel 300 µm clear, 620 mm deckle', itemType: 'RAW_MATERIAL', categoryId: 'CT2', uom: 'KG', defaultSupplierId: 'SP1', defaultBinId: 'BN1', reorderLevel: 500, ratePerUom: 105, materialType: 'PVC', thicknessMicrons: 300, deckleWidthMm: 620, colour: 'Clear', minOrderQtyKg: 500, isFoodGrade: false, hsnCode: '39204900', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT2', itemCode: 'RM-PVC-450A', itemName: 'PVC reel 450 µm amber, 640 mm deckle', itemType: 'RAW_MATERIAL', categoryId: 'CT2', uom: 'KG', defaultSupplierId: 'SP1', defaultBinId: 'BN1', reorderLevel: 400, ratePerUom: 112, materialType: 'PVC', thicknessMicrons: 450, deckleWidthMm: 640, colour: 'Amber', minOrderQtyKg: 400, isFoodGrade: false, hsnCode: '39204900', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT3', itemCode: 'RM-PET-250C', itemName: 'APET reel 250 µm clear, 600 mm deckle', itemType: 'RAW_MATERIAL', categoryId: 'CT3', uom: 'KG', defaultSupplierId: 'SP3', defaultBinId: 'BN2', reorderLevel: 350, ratePerUom: 128, materialType: 'PET', thicknessMicrons: 250, deckleWidthMm: 600, colour: 'Clear', minOrderQtyKg: 350, isFoodGrade: true, hsnCode: '39206290', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT4', itemCode: 'RM-HIP-280W', itemName: 'HIPS reel 280 µm white, 620 mm deckle', itemType: 'RAW_MATERIAL', categoryId: 'CT1', uom: 'KG', defaultSupplierId: 'SP2', defaultBinId: 'BN1', reorderLevel: 600, ratePerUom: 118, materialType: 'HIPS', thicknessMicrons: 280, deckleWidthMm: 620, colour: 'White', minOrderQtyKg: 600, isFoodGrade: true, hsnCode: '39031990', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT11', itemCode: 'RM-PP-400C', itemName: 'PP reel 400 µm clear, 620 mm deckle', itemType: 'RAW_MATERIAL', categoryId: 'CT1', uom: 'KG', defaultSupplierId: 'SP4', defaultBinId: 'BN1', reorderLevel: 400, ratePerUom: 134, materialType: 'PP', thicknessMicrons: 400, deckleWidthMm: 620, colour: 'Clear', minOrderQtyKg: 400, isFoodGrade: true, hsnCode: '39202020', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT5', itemCode: 'PK-CTN-5PLY', itemName: 'Corrugated carton 5-ply, 450 × 350 × 300', itemType: 'PACKING', categoryId: 'CT4', uom: 'NOS', defaultSupplierId: 'SP5', defaultBinId: 'BN5', reorderLevel: 400, ratePerUom: 68, hsnCode: '48191010', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT6', itemCode: 'PK-LDPE-BAG', itemName: 'LDPE liner bag 24 × 30 inch, 50 µm', itemType: 'PACKING', categoryId: 'CT4', uom: 'NOS', defaultSupplierId: 'SP5', defaultBinId: 'BN5', reorderLevel: 2000, ratePerUom: 4.2, hsnCode: '39232100', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT7', itemCode: 'PK-TAPE-48', itemName: 'BOPP tape 48 mm × 65 m', itemType: 'PACKING', categoryId: 'CT4', uom: 'NOS', defaultSupplierId: 'SP5', defaultBinId: 'BN5', reorderLevel: 100, ratePerUom: 32, hsnCode: '39191000', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT8', itemCode: 'CN-IPA-5L', itemName: 'Isopropyl alcohol, 5 litre can', itemType: 'CONSUMABLE', categoryId: 'CT5', uom: 'LTR', defaultSupplierId: null, defaultBinId: 'BN6', reorderLevel: 20, ratePerUom: 240, hsnCode: '29051220', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT9', itemCode: 'SP-HTR-2KW', itemName: 'Ceramic heater element 2 kW, zone type', itemType: 'SPARE', categoryId: 'CT9', uom: 'NOS', defaultSupplierId: null, defaultBinId: 'BN6', reorderLevel: 6, ratePerUom: 1850, hsnCode: '85164000', status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { itemId: 'IT10', itemCode: 'SP-TC-K', itemName: 'K-type thermocouple, 1.5 m lead', itemType: 'SPARE', categoryId: 'CT9', uom: 'NOS', defaultSupplierId: null, defaultBinId: 'BN6', reorderLevel: 10, ratePerUom: 620, hsnCode: '90251190', status: 'ACTIVE', createdBy: BY, createdDate: ON },
]

// ------------------------------------------------------------------- Products

export const PRODUCTS: Product[] = [
  { productId: 'PR1', productCode: 'PRD-0031', productName: 'Vadilal ice cream tray 750 ml, clear', artworkCode: 'AW-PVC-0312', customerId: 'C01', customerName: 'Vadilal Industries', categoryId: 'CT7', materialType: 'PVC', thicknessMicrons: 300, cavityUpsPerSheet: 12, weightPerPieceG: 10.87, standardCostPerPc: 2.13, originJobCardNo: 'JC-2508-071', timesProduced: 6, totalPiecesProduced: 148000, lastProducedOn: '2026-09-09', isSafetyStock: false, safetyStockQty: 0, currentStockQty: 0, status: 'ACTIVE', createdBy: BY, createdDate: '2025-08-14' },
  { productId: 'PR2', productCode: 'PRD-0028', productName: 'Cipla blister base tray, amber', artworkCode: 'AW-PVC-0288', customerId: 'C02', customerName: 'Cipla Ltd', categoryId: 'CT6', materialType: 'PVC', thicknessMicrons: 450, cavityUpsPerSheet: 16, weightPerPieceG: 8.94, standardCostPerPc: 2.86, originJobCardNo: 'JC-2506-044', timesProduced: 11, totalPiecesProduced: 612000, lastProducedOn: '2026-08-28', isSafetyStock: false, safetyStockQty: 0, currentStockQty: 0, status: 'ACTIVE', createdBy: BY, createdDate: '2025-06-11' },
  { productId: 'PR3', productCode: 'PRD-0010', productName: 'Bakery folding tray, white HIPS, generic', artworkCode: 'AW-HIP-0104', customerId: 'C03', customerName: 'Britannia Industries', categoryId: 'CT7', materialType: 'HIPS', thicknessMicrons: 350, cavityUpsPerSheet: 12, weightPerPieceG: 12.41, standardCostPerPc: 2.58, originJobCardNo: 'JC-2411-018', timesProduced: 23, totalPiecesProduced: 1084000, lastProducedOn: '2026-09-08', isSafetyStock: true, safetyStockQty: 20000, currentStockQty: 14600, status: 'ACTIVE', createdBy: BY, createdDate: '2024-11-06' },
  { productId: 'PR4', productCode: 'PRD-0019', productName: 'Ice cream cup liner, white HIPS', artworkCode: 'AW-HIP-0098', customerId: 'C08', customerName: 'Mother Dairy', categoryId: 'CT7', materialType: 'HIPS', thicknessMicrons: 280, cavityUpsPerSheet: 30, weightPerPieceG: 2.90, standardCostPerPc: 1.25, originJobCardNo: 'JC-2503-009', timesProduced: 14, totalPiecesProduced: 918000, lastProducedOn: '2026-09-08', isSafetyStock: false, safetyStockQty: 0, currentStockQty: 0, status: 'ACTIVE', createdBy: BY, createdDate: '2025-03-19' },
  { productId: 'PR5', productCode: 'PRD-0024', productName: 'Zydus vial holder tray, 10-up', artworkCode: 'AW-PVC-0295', customerId: 'C05', customerName: 'Zydus Lifesciences', categoryId: 'CT6', materialType: 'PVC', thicknessMicrons: 500, cavityUpsPerSheet: 6, weightPerPieceG: 34.20, standardCostPerPc: 6.42, originJobCardNo: 'JC-2505-031', timesProduced: 4, totalPiecesProduced: 96000, lastProducedOn: '2026-07-22', isSafetyStock: false, safetyStockQty: 0, currentStockQty: 0, status: 'ACTIVE', createdBy: BY, createdDate: '2025-05-27' },
  { productId: 'PR6', productCode: 'PRD-0007', productName: 'Confectionery insert tray, clear PP, generic', artworkCode: 'AW-PP-0067', customerId: 'C06', customerName: 'Parle Products', categoryId: 'CT7', materialType: 'PP', thicknessMicrons: 400, cavityUpsPerSheet: 12, weightPerPieceG: 9.62, standardCostPerPc: 2.21, originJobCardNo: 'JC-2409-006', timesProduced: 19, totalPiecesProduced: 862000, lastProducedOn: '2026-08-30', isSafetyStock: true, safetyStockQty: 15000, currentStockQty: 18200, status: 'ACTIVE', createdBy: BY, createdDate: '2024-09-12' },
  { productId: 'PR7', productCode: 'PRD-0033', productName: 'Himalaya cream jar insert, 4-cavity', artworkCode: 'AW-PET-0219', customerId: 'C04', customerName: 'Himalaya Wellness', categoryId: 'CT8', materialType: 'PET', thicknessMicrons: 250, cavityUpsPerSheet: 20, weightPerPieceG: 4.16, standardCostPerPc: 1.68, originJobCardNo: 'JC-2606-052', timesProduced: 2, totalPiecesProduced: 34000, lastProducedOn: '2026-06-30', isSafetyStock: false, safetyStockQty: 0, currentStockQty: 0, status: 'ACTIVE', createdBy: BY, createdDate: '2026-06-04' },
  { productId: 'PR8', productCode: 'PRD-0002', productName: 'Universal 6-cavity folding tray, generic', artworkCode: 'AW-HIP-0104', customerId: 'C03', customerName: 'Britannia Industries', categoryId: 'CT7', materialType: 'HIPS', thicknessMicrons: 350, cavityUpsPerSheet: 12, weightPerPieceG: 12.41, standardCostPerPc: 2.62, originJobCardNo: 'JC-2404-002', timesProduced: 31, totalPiecesProduced: 1620000, lastProducedOn: '2026-09-01', isSafetyStock: true, safetyStockQty: 25000, currentStockQty: 9800, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-15' },
]

// ------------------------------------------------------------------ Processes

export const PROCESSES: Process[] = [
  { processId: 'PC1', processCode: 'PRC-010', processName: 'Reel issue from store', stage: 'FORMING', department: 'Stores', machineType: 'NONE', typeOfCharges: 'PER_PIECE', rate: 0, minimumCharges: 0, setupCharges: 0, startUnit: 'KG', endUnit: 'KG', standardTimeMins: 15, processWastePercent: 0, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 1, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC2', processCode: 'PRC-020', processName: 'Forming of trays', stage: 'FORMING', department: 'Production', machineType: 'FORMING', typeOfCharges: 'PER_SHEET', rate: 0.42, minimumCharges: 1500, setupCharges: 850, startUnit: 'KG', endUnit: 'SHEET', standardTimeMins: 240, processWastePercent: 2.5, toolRequired: true, requiresLineClearance: true, requiresFpa: true, sequenceNo: 2, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC3', processCode: 'PRC-030', processName: 'Cutting of formed sheets', stage: 'CUTTING', department: 'Production', machineType: 'CUTTING', typeOfCharges: 'PER_PIECE', rate: 0.28, minimumCharges: 1200, setupCharges: 600, startUnit: 'SHEET', endUnit: 'PIECE', standardTimeMins: 160, processWastePercent: 1.0, toolRequired: true, requiresLineClearance: true, requiresFpa: true, sequenceNo: 3, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC4', processCode: 'PRC-040', processName: 'Sorting and inspection', stage: 'SORTING', department: 'Quality', machineType: 'NONE', typeOfCharges: 'PER_PIECE', rate: 0.09, minimumCharges: 400, setupCharges: 0, startUnit: 'PIECE', endUnit: 'PIECE', standardTimeMins: 90, processWastePercent: 0.9, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 4, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC5', processCode: 'PRC-050', processName: 'Bagging and carton packing', stage: 'PACKING', department: 'Dispatch', machineType: 'NONE', typeOfCharges: 'PER_PIECE', rate: 0.06, minimumCharges: 300, setupCharges: 0, startUnit: 'PIECE', endUnit: 'BOX', standardTimeMins: 60, processWastePercent: 0, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 5, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC6', processCode: 'PRC-060', processName: 'FG inspection and COA', stage: 'QC', department: 'Quality', machineType: 'NONE', typeOfCharges: 'PER_HOUR', rate: 320, minimumCharges: 320, setupCharges: 0, startUnit: 'BOX', endUnit: 'BOX', standardTimeMins: 45, processWastePercent: 0, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 6, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC7', processCode: 'PRC-070', processName: 'Dispatch and gate pass', stage: 'DISPATCH', department: 'Dispatch', machineType: 'NONE', typeOfCharges: 'PER_HOUR', rate: 260, minimumCharges: 260, setupCharges: 0, startUnit: 'BOX', endUnit: 'BOX', standardTimeMins: 30, processWastePercent: 0, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 7, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { processId: 'PC8', processCode: 'PRC-080', processName: 'Skeleton grinding', stage: 'RECYCLING', department: 'Production', machineType: 'NONE', typeOfCharges: 'PER_HOUR', rate: 180, minimumCharges: 180, setupCharges: 0, startUnit: 'KG', endUnit: 'KG', standardTimeMins: 40, processWastePercent: 3.0, toolRequired: false, requiresLineClearance: false, requiresFpa: false, sequenceNo: 8, status: 'ACTIVE', createdBy: BY, createdDate: ON },
]

// --------------------------------------------------------- Warehouses & bins

export const WAREHOUSES: Warehouse[] = [
  { warehouseId: 'WH1', warehouseCode: 'WH-RM', warehouseName: 'Raw material store', location: 'Vasai Unit-1, ground floor east', binCount: 3, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { warehouseId: 'WH2', warehouseCode: 'WH-FG', warehouseName: 'Finished goods store', location: 'Vasai Unit-1, ground floor west', binCount: 2, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { warehouseId: 'WH3', warehouseCode: 'WH-GEN', warehouseName: 'General and spares', location: 'Vasai Unit-1, mezzanine', binCount: 2, status: 'ACTIVE', createdBy: BY, createdDate: ON },
]

export const BINS: Bin[] = [
  { binId: 'BN1', binCode: 'RM-A', binName: 'QC approved reels, Rack A', warehouseId: 'WH1', binType: 'QC_APPROVED', capacityKg: 4000, occupiedKg: 1143.3, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN2', binCode: 'RM-H', binName: 'Quarantine hold bin', warehouseId: 'WH1', binType: 'QUARANTINE', capacityKg: 1200, occupiedKg: 675.0, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN3', binCode: 'RM-R', binName: 'Rejected material, return to supplier', warehouseId: 'WH1', binType: 'REJECTED', capacityKg: 800, occupiedKg: 260.0, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN4', binCode: 'FG-01', binName: 'Finished goods, ready to dispatch', warehouseId: 'WH2', binType: 'FINISHED_GOODS', capacityKg: 3000, occupiedKg: 1820.5, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN5', binCode: 'FG-PK', binName: 'Packing material store', warehouseId: 'WH2', binType: 'GENERAL', capacityKg: 1500, occupiedKg: 410.8, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN6', binCode: 'GN-SP', binName: 'Spares and consumables', warehouseId: 'WH3', binType: 'GENERAL', capacityKg: 600, occupiedKg: 172.4, status: 'ACTIVE', createdBy: BY, createdDate: ON },
  { binId: 'BN7', binCode: 'GN-SC', binName: 'Scrap collection, awaiting grinding', warehouseId: 'WH3', binType: 'SCRAP', capacityKg: 1000, occupiedKg: 415.5, status: 'ACTIVE', createdBy: BY, createdDate: ON },
]

// ---------------------------------------------------------------------- Users

export const USERS: User[] = [
  { userId: 'U01', userCode: 'USR-001', userName: 'Tejas Mehta', loginUserName: 'tejas.mehta', email: 'tejas@desform.in', contactNo: '+91 98200 11002', designation: 'Director', role: 'ADMIN', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: true, lastLoginAt: '2026-09-09 08:41', mustResetPassword: false, status: 'ACTIVE', createdBy: 'System', createdDate: '2024-04-01' },
  { userId: 'U02', userCode: 'USR-004', userName: 'Yuvraj Bhaigude', loginUserName: 'yuvraj.b', email: 'yuvraj@desform.in', contactNo: '+91 98195 44120', designation: 'Production Manager', role: 'MANAGER', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 07:12', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-08' },
  { userId: 'U03', userCode: 'USR-007', userName: 'Swapnil Pawar', loginUserName: 'swapnil.p', email: 'swapnil@desform.in', contactNo: '+91 99870 33218', designation: 'QA Manager', role: 'MANAGER', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 07:58', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-08' },
  { userId: 'U04', userCode: 'USR-011', userName: 'Sunita Rane', loginUserName: 'sunita.r', email: 'sunita@desform.in', contactNo: '+91 97694 20017', designation: 'QC Executive', role: 'QC', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 07:45', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-07-22' },
  { userId: 'U05', userCode: 'USR-014', userName: 'Meera Shinde', loginUserName: 'meera.s', email: 'meera@desform.in', contactNo: '+91 90040 71126', designation: 'QC Executive', role: 'QC', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-08 20:10', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2025-01-15' },
  { userId: 'U06', userCode: 'USR-018', userName: 'Anil Kadam', loginUserName: 'anil.k', email: 'anil@desform.in', contactNo: '+91 98337 55901', designation: 'Machine Operator', role: 'OPERATOR', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 06:55', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-05-30' },
  { userId: 'U07', userCode: 'USR-021', userName: 'Ramesh Patil', loginUserName: 'ramesh.p', email: 'ramesh@desform.in', contactNo: '+91 93240 18876', designation: 'Machine Operator', role: 'OPERATOR', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-08 19:40', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-09-02' },
  { userId: 'U08', userCode: 'USR-025', userName: 'Dattatray More', loginUserName: 'dattatray.m', email: 'dattatray@desform.in', contactNo: '+91 91367 40023', designation: 'Cutting Operator', role: 'OPERATOR', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 07:02', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2025-02-11' },
  { userId: 'U09', userCode: 'USR-029', userName: 'Kavita Jadhav', loginUserName: 'kavita.j', email: 'kavita@desform.in', contactNo: '+91 96199 22540', designation: 'Packing Supervisor', role: 'SUPERVISOR', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 07:20', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2025-04-18' },
  { userId: 'U10', userCode: 'USR-033', userName: 'Prakash Naik', loginUserName: 'prakash.n', email: 'prakash@desform.in', contactNo: '+91 98925 60714', designation: 'Store Keeper', role: 'STORE', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-09-09 06:40', mustResetPassword: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-06-05' },
  { userId: 'U11', userCode: 'USR-038', userName: 'Nikhil Sawant', loginUserName: 'nikhil.s', email: 'nikhil@desform.in', contactNo: '+91 90291 83345', designation: 'Accounts Executive', role: 'ACCOUNTS', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: null, mustResetPassword: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-01' },
  { userId: 'U12', userCode: 'USR-040', userName: 'Pooja Gupta', loginUserName: 'pooja.g', email: 'pooja@desform.in', contactNo: '+91 98673 11208', designation: 'Planning Executive', role: 'SUPERVISOR', branch: 'Vasai', productionUnit: 'Unit-1', isAdmin: false, lastLoginAt: '2026-08-14 11:05', mustResetPassword: false, status: 'INACTIVE', createdBy: BY, createdDate: '2025-11-20' },
]

// ------------------------------------------------------------------ Employees

export const EMPLOYEES: Employee[] = [
  { employeeId: 'E01', employeeCode: 'EMP-001', userId: 'U01', department: 'Administration', shift: 'General', dateOfJoining: '2024-04-01', certifiedFor: ['Approvals'], reportsToEmployeeId: null, status: 'ACTIVE', createdBy: 'System', createdDate: '2024-04-01' },
  { employeeId: 'E02', employeeCode: 'EMP-004', userId: 'U02', department: 'Production', shift: 'General', dateOfJoining: '2024-04-08', certifiedFor: ['Scheduling', 'TF-01', 'TF-02', 'TF-03'], reportsToEmployeeId: 'E01', status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-08' },
  { employeeId: 'E03', employeeCode: 'EMP-007', userId: 'U03', department: 'Quality', shift: 'General', dateOfJoining: '2024-04-08', certifiedFor: ['IQC', 'COA', 'FG inspection'], reportsToEmployeeId: 'E01', status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-08' },
  { employeeId: 'E04', employeeCode: 'EMP-014', userId: 'U04', department: 'Quality', shift: 'A', dateOfJoining: '2024-07-22', certifiedFor: ['IQC', 'Line clearance', 'First piece'], reportsToEmployeeId: 'E03', status: 'ACTIVE', createdBy: BY, createdDate: '2024-07-22' },
  { employeeId: 'E05', employeeCode: 'EMP-021', userId: 'U05', department: 'Quality', shift: 'B', dateOfJoining: '2025-01-15', certifiedFor: ['In-process', 'FG inspection', 'COA'], reportsToEmployeeId: 'E03', status: 'ACTIVE', createdBy: BY, createdDate: '2025-01-15' },
  { employeeId: 'E06', employeeCode: 'EMP-018', userId: 'U06', department: 'Production', shift: 'A', dateOfJoining: '2024-05-30', certifiedFor: ['TF-01', 'TF-02'], reportsToEmployeeId: 'E02', status: 'ACTIVE', createdBy: BY, createdDate: '2024-05-30' },
  { employeeId: 'E07', employeeCode: 'EMP-009', userId: 'U07', department: 'Production', shift: 'B', dateOfJoining: '2024-09-02', certifiedFor: ['TF-01', 'TF-03'], reportsToEmployeeId: 'E02', status: 'ACTIVE', createdBy: BY, createdDate: '2024-09-02' },
  { employeeId: 'E08', employeeCode: 'EMP-016', userId: 'U08', department: 'Production', shift: 'A', dateOfJoining: '2025-02-11', certifiedFor: ['PN-01', 'PN-02'], reportsToEmployeeId: 'E02', status: 'ACTIVE', createdBy: BY, createdDate: '2025-02-11' },
  { employeeId: 'E09', employeeCode: 'EMP-025', userId: 'U09', department: 'Dispatch', shift: 'A', dateOfJoining: '2025-04-18', certifiedFor: ['Sorting', 'Carton close'], reportsToEmployeeId: 'E02', status: 'ACTIVE', createdBy: BY, createdDate: '2025-04-18' },
  { employeeId: 'E10', employeeCode: 'EMP-003', userId: 'U10', department: 'Stores', shift: 'General', dateOfJoining: '2024-06-05', certifiedFor: ['GRN', 'Reel issue', 'Returns'], reportsToEmployeeId: 'E01', status: 'ACTIVE', createdBy: BY, createdDate: '2024-06-05' },
  { employeeId: 'E11', employeeCode: 'EMP-031', userId: 'U11', department: 'Administration', shift: 'General', dateOfJoining: '2026-09-01', certifiedFor: [], reportsToEmployeeId: 'E01', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-01' },
]

// -------------------------------------------------------------------- Modules

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'QC', 'STORE', 'ACCOUNTS']

const P = (view: boolean, create = false, edit = false, approve = false): ModulePermission => ({
  view, create, edit, approve,
})

/** Builds a permission map, defaulting every unnamed role to no access. */
function perms(overrides: Partial<Record<UserRole, ModulePermission>>) {
  return ROLES.reduce<Record<UserRole, ModulePermission>>(
    (acc, role) => {
      acc[role] = overrides[role] ?? P(false)
      return acc
    },
    {} as Record<UserRole, ModulePermission>,
  )
}

const FULL = P(true, true, true, true)
const EDIT = P(true, true, true)
const VIEW = P(true)

export const MODULES: AppModule[] = [
  { moduleId: 'M01', moduleCode: 'MOD-DASH', moduleName: 'Dashboard', route: '/dashboard', moduleGroup: 'Overview', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: VIEW, SUPERVISOR: VIEW, QC: VIEW, STORE: VIEW, ACCOUNTS: VIEW }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M02', moduleCode: 'MOD-SO', moduleName: 'Sales Orders', route: '/sales-order', moduleGroup: 'Order to Cash', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: FULL, SUPERVISOR: VIEW, ACCOUNTS: EDIT }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M03', moduleCode: 'MOD-JC', moduleName: 'Job Cards', route: '/job-card', moduleGroup: 'Order to Cash', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: FULL, SUPERVISOR: EDIT, OPERATOR: VIEW, QC: VIEW, STORE: VIEW }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M04', moduleCode: 'MOD-FRM', moduleName: 'Forming Entry', route: '/forming', moduleGroup: 'Production', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: FULL, SUPERVISOR: EDIT, OPERATOR: EDIT, QC: P(true, false, false, true) }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M05', moduleCode: 'MOD-PNC', moduleName: 'Cutting Entry', route: '/cutting', moduleGroup: 'Production', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: FULL, SUPERVISOR: EDIT, OPERATOR: EDIT, QC: P(true, false, false, true) }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M06', moduleCode: 'MOD-QC', moduleName: 'Quality Control', route: '/quality', moduleGroup: 'Quality', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: VIEW, SUPERVISOR: VIEW, QC: FULL, OPERATOR: VIEW }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M07', moduleCode: 'MOD-PKG', moduleName: 'Packing & Dispatch', route: '/packing', moduleGroup: 'Fulfilment', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: FULL, SUPERVISOR: EDIT, ACCOUNTS: VIEW, STORE: EDIT }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M08', moduleCode: 'MOD-RCY', moduleName: 'Recycling', route: '/recycling', moduleGroup: 'Fulfilment', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: VIEW, SUPERVISOR: EDIT, STORE: EDIT }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M09', moduleCode: 'MOD-MST', moduleName: 'Masters', route: '/master', moduleGroup: 'System', enabled: true, rolePermissions: perms({ ADMIN: FULL, MANAGER: EDIT, STORE: VIEW }), status: 'ACTIVE', createdBy: 'System', createdDate: ON },
  { moduleId: 'M10', moduleCode: 'MOD-RPT', moduleName: 'Reports', route: '/reports', moduleGroup: 'System', enabled: false, rolePermissions: perms({ ADMIN: FULL, MANAGER: VIEW, ACCOUNTS: VIEW }), status: 'INACTIVE', createdBy: 'System', createdDate: ON },
]

// ------------------------------------------------------------------- Prefixes

const FY = '2026-27'

export const DOCUMENT_PREFIXES: DocumentPrefix[] = [
  { prefixId: 'PX1', documentKind: 'SALES_ORDER', documentName: 'Sales Order', prefix: 'SO', financialYear: FY, separator: '-', padding: 4, currentNumber: 41, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX2', documentKind: 'JOB_CARD', documentName: 'Job Card', prefix: 'JC', financialYear: FY, separator: '-', padding: 4, currentNumber: 124, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX3', documentKind: 'GRN', documentName: 'Goods Receipt Note', prefix: 'GRN', financialYear: FY, separator: '-', padding: 4, currentNumber: 206, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX4', documentKind: 'INVOICE', documentName: 'Tax Invoice', prefix: 'INV', financialYear: FY, separator: '-', padding: 4, currentNumber: 442, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX5', documentKind: 'DELIVERY_NOTE', documentName: 'Delivery Note', prefix: 'DN', financialYear: FY, separator: '-', padding: 4, currentNumber: 431, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX6', documentKind: 'COA', documentName: 'Certificate of Analysis', prefix: 'COA', financialYear: FY, separator: '-', padding: 4, currentNumber: 89, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX7', documentKind: 'RECYCLING_NOTE', documentName: 'Recycling Transfer Note', prefix: 'RCY', financialYear: FY, separator: '-', padding: 4, currentNumber: 117, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
  { prefixId: 'PX8', documentKind: 'ARTWORK', documentName: 'Artwork Code', prefix: 'AW', financialYear: FY, separator: '-', padding: 4, currentNumber: 312, resetsAnnually: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-01' },
  { prefixId: 'PX9', documentKind: 'PRODUCT', documentName: 'Product Code', prefix: 'PRD', financialYear: FY, separator: '-', padding: 4, currentNumber: 33, resetsAnnually: false, status: 'ACTIVE', createdBy: BY, createdDate: '2024-04-01' },
  { prefixId: 'PX10', documentKind: 'GATE_PASS', documentName: 'Gate Pass', prefix: 'GP', financialYear: FY, separator: '-', padding: 4, currentNumber: 318, resetsAnnually: true, status: 'ACTIVE', createdBy: BY, createdDate: '2026-04-01' },
]
