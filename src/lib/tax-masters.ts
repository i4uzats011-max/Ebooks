// Indian Statutory Tax Masters & Compliance Codes

export interface StateMaster {
  code: number;
  name: string;
}

export const INDIAN_STATES: StateMaster[] = [
  { code: 1, name: 'JAMMU AND KASHMIR' },
  { code: 2, name: 'HIMACHAL PRADESH' },
  { code: 3, name: 'PUNJAB' },
  { code: 4, name: 'CHANDIGARH' },
  { code: 5, name: 'UTTARAKHAND' },
  { code: 6, name: 'HARYANA' },
  { code: 7, name: 'DELHI' },
  { code: 8, name: 'RAJASTHAN' },
  { code: 9, name: 'UTTAR PRADESH' },
  { code: 10, name: 'BIHAR' },
  { code: 11, name: 'SIKKIM' },
  { code: 12, name: 'ARUNACHAL PRADESH' },
  { code: 13, name: 'NAGALAND' },
  { code: 14, name: 'MANIPUR' },
  { code: 15, name: 'MIZORAM' },
  { code: 16, name: 'TRIPURA' },
  { code: 17, name: 'MEGHALAYA' },
  { code: 18, name: 'ASSAM' },
  { code: 19, name: 'WEST BENGAL' },
  { code: 20, name: 'JHARKHAND' },
  { code: 21, name: 'ODISHA' },
  { code: 22, name: 'CHHATTISGARH' },
  { code: 23, name: 'MADHYA PRADESH' },
  { code: 24, name: 'GUJARAT' },
  { code: 25, name: 'DAMAN AND DIU' },
  { code: 26, name: 'DADRA AND NAGAR HAVELI' },
  { code: 27, name: 'MAHARASHTRA' },
  { code: 28, name: 'ANDHRA PRADESH (BEFORE SPLIT)' },
  { code: 29, name: 'KARNATAKA' },
  { code: 30, name: 'GOA' },
  { code: 31, name: 'LAKSHADWEEP' },
  { code: 32, name: 'KERALA' },
  { code: 33, name: 'TAMIL NADU' },
  { code: 34, name: 'PUDUCHERRY' },
  { code: 35, name: 'ANDAMAN AND NICOBAR' },
  { code: 36, name: 'TELANGANA' },
  { code: 37, name: 'ANDHRA PRADESH' },
  { code: 38, name: 'LADAKH' },
  { code: 97, name: 'OTHER TERRITORY' },
  { code: 99, name: 'OTHER COUNTRIES' }
];

export interface UqcMaster {
  code: string;
  name: string;
}

export const GST_UQC_LIST: UqcMaster[] = [
  { code: 'BAG', name: 'BAGS' },
  { code: 'BAL', name: 'BALE' },
  { code: 'BDL', name: 'BUNDLES' },
  { code: 'BKL', name: 'BUCKLES' },
  { code: 'BOU', name: 'BILLION OF UNITS' },
  { code: 'BOX', name: 'BOX' },
  { code: 'BTL', name: 'BOTTLES' },
  { code: 'BUN', name: 'BUNCHES' },
  { code: 'CAN', name: 'CANS' },
  { code: 'CBM', name: 'CUBIC METERS' },
  { code: 'CCM', name: 'CUBIC CENTIMETERS' },
  { code: 'CMS', name: 'CENTIMETERS' },
  { code: 'CTN', name: 'CARTONS' },
  { code: 'DOZ', name: 'DOZENS' },
  { code: 'DRM', name: 'DRUMS' },
  { code: 'GGK', name: 'GREAT GROSS' },
  { code: 'GMS', name: 'GRAMMES' },
  { code: 'GRS', name: 'GROSS' },
  { code: 'GYD', name: 'GROSS YARDS' },
  { code: 'KGS', name: 'KILOGRAMS' },
  { code: 'KLR', name: 'KILOLITRE' },
  { code: 'KME', name: 'KILOMETRE' },
  { code: 'LTR', name: 'LITRES' },
  { code: 'MLT', name: 'MILILITRE' },
  { code: 'MTR', name: 'METERS' },
  { code: 'MTS', name: 'METRIC TON' },
  { code: 'NOS', name: 'NUMBERS' },
  { code: 'OTH', name: 'OTHERS' },
  { code: 'PAC', name: 'PACKS' },
  { code: 'PCS', name: 'PIECES' },
  { code: 'PRS', name: 'PAIRS' },
  { code: 'QTL', name: 'QUINTAL' },
  { code: 'ROL', name: 'ROLLS' },
  { code: 'SET', name: 'SETS' },
  { code: 'SQF', name: 'SQUARE FEET' },
  { code: 'SQM', name: 'SQUARE METERS' },
  { code: 'SQY', name: 'SQUARE YARDS' },
  { code: 'TBS', name: 'TABLETS' },
  { code: 'TGM', name: 'TEN GROSS' },
  { code: 'THD', name: 'THOUSANDS' },
  { code: 'TON', name: 'TONNES' },
  { code: 'TUB', name: 'TUBES' },
  { code: 'UGS', name: 'US GALLONS' },
  { code: 'UNT', name: 'UNITS' },
  { code: 'YDS', name: 'YARDS' }
];

// TDS & TCS Master Rates for Tax Year 2026-27 (Compliant with IT Act 2025 sections and TDSMAN schedule)
export interface TdsSectionMaster {
  code: string;
  oldSection: string;
  newSection: string;
  natureOfPayment: string;
  rate: number;
  threshold: number;
  thresholdDesc?: string;
  formType: '26Q' | '27EQ' | '24Q';
}

export const TDS_TCS_RATES_2026_27: TdsSectionMaster[] = [
  // 1. Salary (Form 24Q)
  { code: '1002', oldSection: '192', newSection: '392', natureOfPayment: 'Salary - Non-Government Employees', rate: 0, threshold: 300000, thresholdDesc: 'As per tax slab', formType: '24Q' },
  
  // 2. Contractor Payments (Form 26Q)
  { code: '1023', oldSection: '194C', newSection: '393(1)', natureOfPayment: 'Contractor Payment - Individual / HUF', rate: 1.0, threshold: 30000, thresholdDesc: '₹30,000 single / ₹1,00,000 aggregate', formType: '26Q' },
  { code: '1024', oldSection: '194C', newSection: '393(1)', natureOfPayment: 'Contractor Payment - Company / Firm / Others', rate: 2.0, threshold: 30000, thresholdDesc: '₹30,000 single / ₹1,00,000 aggregate', formType: '26Q' },

  // 3. Professional & Technical Fees
  { code: '1026', oldSection: '194J(a)', newSection: '393(1)', natureOfPayment: 'Fees for Technical Services / Call Center', rate: 2.0, threshold: 50000, thresholdDesc: '₹50,000 per financial year', formType: '26Q' },
  { code: '1027', oldSection: '194J(b)', newSection: '393(1)', natureOfPayment: 'Fees for Professional Services', rate: 10.0, threshold: 50000, thresholdDesc: '₹50,000 per financial year', formType: '26Q' },
  { code: '1028', oldSection: '194J(b)', newSection: '393(1)', natureOfPayment: 'Director Remuneration / Fees / Commission', rate: 10.0, threshold: 0, thresholdDesc: 'No threshold', formType: '26Q' },

  // 4. Rent
  { code: '1008', oldSection: '194I(a)', newSection: '393(1)', natureOfPayment: 'Rent on Plant & Machinery', rate: 2.0, threshold: 50000, thresholdDesc: '₹50,000 per month (₹6,00,000 p.a.)', formType: '26Q' },
  { code: '1009', oldSection: '194I(b)', newSection: '393(1)', natureOfPayment: 'Rent on Land, Building or Furniture', rate: 10.0, threshold: 50000, thresholdDesc: '₹50,000 per month (₹6,00,000 p.a.)', formType: '26Q' },

  // 5. Commission & Brokerage
  { code: '1006', oldSection: '194H', newSection: '393(1)', natureOfPayment: 'Commission or Brokerage - General', rate: 2.0, threshold: 20000, thresholdDesc: '₹20,000 per financial year', formType: '26Q' },

  // 6. Purchase of Goods
  { code: '1031', oldSection: '194Q', newSection: '393(1)', natureOfPayment: 'TDS on Purchase of Goods exceeding ₹50 Lakhs', rate: 0.1, threshold: 5000000, thresholdDesc: 'In excess of ₹50 Lakhs', formType: '26Q' },

  // 7. TCS (Tax Collected at Source - Form 27EQ)
  { code: '1073', oldSection: '206C - E', newSection: '394(1)', natureOfPayment: 'TCS on Sale of Scrap', rate: 2.0, threshold: 0, thresholdDesc: 'All scrap sales', formType: '27EQ' },
  { code: '1074', oldSection: '206C - J', newSection: '394(1)', natureOfPayment: 'TCS on Minerals (Coal, Lignite, Iron Ore)', rate: 2.0, threshold: 0, thresholdDesc: 'All mineral sales', formType: '27EQ' },
  { code: '1075', oldSection: '206C - L', newSection: '394(1)', natureOfPayment: 'TCS on Sale of Motor Vehicles (> ₹10 Lakhs)', rate: 1.0, threshold: 1000000, thresholdDesc: 'Above ₹10 Lakhs', formType: '27EQ' },
  { code: '1086', oldSection: '206C - T', newSection: '394(1)', natureOfPayment: 'TCS on LRS Remittance (Education/Medical > 10L)', rate: 2.0, threshold: 1000000, thresholdDesc: 'Above ₹10 Lakhs', formType: '27EQ' },
  { code: '1087', oldSection: '206C - Q', newSection: '394(1)', natureOfPayment: 'TCS on LRS Remittance (Other purposes > 10L)', rate: 20.0, threshold: 1000000, thresholdDesc: 'Above ₹10 Lakhs', formType: '27EQ' }
];

// E-Way Bill JSON Code Lookups
export const EWB_SUPPLY_TYPES = [
  { value: 'O', label: 'Outward (Sale / Dispatch)' },
  { value: 'I', label: 'Inward (Purchase / Receipt)' }
];

export const EWB_SUB_SUPPLY_TYPES = [
  { value: 1, label: 'Supply' },
  { value: 2, label: 'Import' },
  { value: 3, label: 'Export' },
  { value: 4, label: 'Job Work' },
  { value: 5, label: 'For Own Use' },
  { value: 6, label: 'Job Work Returns' },
  { value: 7, label: 'Sales Return' },
  { value: 8, label: 'Others' },
  { value: 9, label: 'SKD / CKD / Lots' },
  { value: 10, label: 'Line Sales' },
  { value: 11, label: 'Recipient Not Known' },
  { value: 12, label: 'Exhibition or Fairs' }
];

export const EWB_DOC_TYPES = [
  { value: 'INV', label: 'Tax Invoice' },
  { value: 'BIL', label: 'Bill of Supply' },
  { value: 'BOE', label: 'Bill of Entry' },
  { value: 'CHL', label: 'Delivery Challan' },
  { value: 'OTH', label: 'Others' }
];

export const EWB_TRANS_MODES = [
  { value: 1, label: 'Road' },
  { value: 2, label: 'Rail' },
  { value: 3, label: 'Air' },
  { value: 4, label: 'Ship / Road cum Ship' }
];

export const EWB_VEHICLE_TYPES = [
  { value: 'R', label: 'Regular' },
  { value: 'O', label: 'ODC (Over Dimensional Cargo)' }
];
