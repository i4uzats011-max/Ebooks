// Indian Enterprise ERP - Core Type Definitions

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SENIOR_ACCOUNTANT'
  | 'BILLING_EXECUTIVE'
  | 'INVENTORY_MANAGER'
  | 'HR_PAYROLL_MANAGER'
  | 'TAX_AUDITOR';

export type PermissionKey =
  | 'invoices:create'
  | 'invoices:view'
  | 'invoices:edit'
  | 'invoices:delete'
  | 'invoices:approve'
  | 'invoices:print'
  | 'purchases:create'
  | 'purchases:view'
  | 'purchases:edit'
  | 'ledgers:create'
  | 'ledgers:view'
  | 'ledgers:edit'
  | 'vouchers:create'
  | 'vouchers:view'
  | 'reports:balance_sheet'
  | 'reports:profit_loss'
  | 'reports:trial_balance'
  | 'reports:daybook'
  | 'inventory:create_item'
  | 'inventory:view_stock'
  | 'inventory:adjust_stock'
  | 'compliance:gst1'
  | 'compliance:gst2'
  | 'compliance:gst3b'
  | 'compliance:eway_bill'
  | 'compliance:tds_tcs'
  | 'payroll:manage_employees'
  | 'payroll:process_salary'
  | 'payroll:view_payslips'
  | 'users:manage_roles'
  | 'users:manage_users';

export interface ERPUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  permissions: PermissionKey[];
  is_active: boolean;
  created_at?: string;
}

export interface CompanyProfile {
  id: number;
  company_name: string;
  trade_name?: string;
  gstin: string;
  pan: string;
  tan?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_name: string;
  state_code: number;
  pincode: number;
  email?: string;
  phone?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  lut_arn?: string;
}

export type UnitRelationType = 'FIXED_COMPOUND' | 'LOOSE_VARIABLE';

export interface StockItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  hsn_code: string;
  primary_unit: string;
  secondary_unit?: string | null;
  unit_relation_type: UnitRelationType;
  conversion_factor: number;
  opening_stock_primary: number;
  opening_stock_secondary?: number | null;
  current_stock_primary: number;
  current_stock_secondary?: number | null;
  cost_price: number;
  selling_price: number;
  gst_rate: number;
  cess_rate: number;
  min_reorder_level: number;
}

export interface InvoiceItem {
  id?: number;
  item_id?: number | null;
  product_name: string;
  hsn_code: string;
  primary_qty: number;
  primary_unit: string;
  secondary_qty?: number | null;
  secondary_unit?: string | null;
  unit_rate: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_rate?: number;
  cess_amount?: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  direction: 'OUTWARD' | 'INWARD';
  invoice_type: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'EXPORT' | 'CHALLAN';
  party_name: string;
  party_gstin?: string;
  party_pan?: string;
  party_state_code: number;
  place_of_supply: string;
  party_address?: string;
  party_pincode?: number;
  invoice_date: string;
  due_date?: string;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  tds_amount: number;
  tds_section?: string;
  tcs_amount: number;
  tcs_section?: string;
  round_off: number;
  total_amount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  created_by_user_id?: number;
  eway_bill_no?: string;
  eway_bill_date?: string;
  eway_bill_status?: string;
  trans_mode?: number;
  vehicle_no?: string;
  vehicle_type?: string;
  trans_distance?: number;
  transporter_id?: string;
  transporter_name?: string;
  items?: InvoiceItem[];
}

export interface Ledger {
  id: number;
  code: string;
  name: string;
  group_type: string;
  balance_type: 'DR' | 'CR';
  opening_balance: number;
  current_balance: number;
  is_system: boolean;
}

export interface JournalVoucher {
  id: number;
  voucher_no: string;
  voucher_type: 'SALES' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'CONTRA' | 'PAYROLL';
  voucher_date: string;
  reference_no?: string;
  narration?: string;
  items?: JournalVoucherItem[];
}

export interface JournalVoucherItem {
  id?: number;
  voucher_id?: number;
  ledger_id: number;
  ledger_name?: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface Employee {
  id: number;
  emp_code: string;
  full_name: string;
  designation: string;
  department: string;
  date_of_joining: string;
  pan: string;
  uan?: string;
  pf_number?: string;
  esic_number?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  gross_salary: number;
  is_pf_eligible: boolean;
  is_esi_eligible: boolean;
  is_pt_eligible: boolean;
  is_active: boolean;
}

export interface PayrollRecord {
  id: number;
  month: string;
  employee_id: number;
  employee_name?: string;
  emp_code?: string;
  designation?: string;
  working_days: number;
  present_days: number;
  basic_earned: number;
  hra_earned: number;
  special_allowance_earned: number;
  gross_earned: number;
  epf_employee: number;
  epf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  tds_deducted: number;
  other_deductions: number;
  total_deductions: number;
  net_payable: number;
  payment_status: string;
  payment_date?: string;
}

export interface TdsTcsEntry {
  id: number;
  nature_type: 'TDS' | 'TCS';
  old_section: string;
  new_section: string;
  return_code: string;
  party_name: string;
  party_pan: string;
  invoice_ref?: string;
  transaction_date: string;
  booking_amount: number;
  tax_rate: number;
  tax_deducted: number;
  challan_bsr_code?: string;
  challan_no?: string;
  challan_date?: string;
  form_type: '26Q' | '27EQ' | '24Q';
  quarter: string;
  financial_year: string;
  is_paid: boolean;
}
