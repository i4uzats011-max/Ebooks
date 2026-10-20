import { ERPUser, PermissionKey, UserRole } from './types';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'Invoicing & Sales' | 'Ledgers & Vouchers' | 'Financial Reports' | 'Inventory & Stock' | 'Compliance & Returns' | 'Payroll & HR' | 'System & Users';
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Invoicing & Sales
  { key: 'invoices:create', label: 'Create Invoices', description: 'Can generate new GST Tax Invoices and Bills of Supply', category: 'Invoicing & Sales' },
  { key: 'invoices:view', label: 'View Invoices', description: 'Can view sales invoices and dispatch details', category: 'Invoicing & Sales' },
  { key: 'invoices:edit', label: 'Edit Invoices', description: 'Can alter draft invoices and party details', category: 'Invoicing & Sales' },
  { key: 'invoices:delete', label: 'Cancel / Delete Invoices', description: 'Can cancel or void approved tax invoices', category: 'Invoicing & Sales' },
  { key: 'invoices:approve', label: 'Approve Invoices', description: 'Can authorize and finalize invoices for accounts posting', category: 'Invoicing & Sales' },
  { key: 'invoices:print', label: 'Print / Export Invoices', description: 'Can print GST tax invoice formats and export PDF', category: 'Invoicing & Sales' },

  // Purchases
  { key: 'purchases:create', label: 'Record Purchases', description: 'Can book vendor purchase bills and inward supplies', category: 'Invoicing & Sales' },
  { key: 'purchases:view', label: 'View Purchases', description: 'Can view purchase registers and vendor bills', category: 'Invoicing & Sales' },
  { key: 'purchases:edit', label: 'Edit Purchases', description: 'Can edit purchase bills and ITC eligibility', category: 'Invoicing & Sales' },

  // Ledgers & Vouchers
  { key: 'ledgers:create', label: 'Create Ledgers', description: 'Can add new accounts in the Indian Chart of Accounts', category: 'Ledgers & Vouchers' },
  { key: 'ledgers:view', label: 'View Ledgers', description: 'Can view account ledgers and opening balances', category: 'Ledgers & Vouchers' },
  { key: 'ledgers:edit', label: 'Edit Ledgers', description: 'Can alter ledger groups and tax configurations', category: 'Ledgers & Vouchers' },
  { key: 'vouchers:create', label: 'Post Vouchers (F4-F9)', description: 'Can record Contra, Payment, Receipt, Journal vouchers', category: 'Ledgers & Vouchers' },
  { key: 'vouchers:view', label: 'View Vouchers', description: 'Can browse daybook and voucher registers', category: 'Ledgers & Vouchers' },

  // Financial Reports
  { key: 'reports:balance_sheet', label: 'View Balance Sheet', description: 'Access to real-time Balance Sheet and Financial Position', category: 'Financial Reports' },
  { key: 'reports:profit_loss', label: 'View Profit & Loss', description: 'Access to Trading Account, Gross and Net Profit Statements', category: 'Financial Reports' },
  { key: 'reports:trial_balance', label: 'View Trial Balance', description: 'Access to Debit-Credit Trial Balance and ledger totals', category: 'Financial Reports' },
  { key: 'reports:daybook', label: 'View Day Book', description: 'Access to chronological transaction records', category: 'Financial Reports' },

  // Inventory & Stock
  { key: 'inventory:create_item', label: 'Create Stock Items', description: 'Can add new stock items with compound or loose units', category: 'Inventory & Stock' },
  { key: 'inventory:view_stock', label: 'View Stock & Rates', description: 'Can view stock valuation, balances, and reorder levels', category: 'Inventory & Stock' },
  { key: 'inventory:adjust_stock', label: 'Adjust Physical Stock', description: 'Can record physical stock count and scrap write-offs', category: 'Inventory & Stock' },

  // Compliance & Returns
  { key: 'compliance:gst1', label: 'GSTR-1 Outward Return', description: 'Can preview and export government GSTR-1 JSON', category: 'Compliance & Returns' },
  { key: 'compliance:gst2', label: 'GSTR-2A/2B ITC Recon', description: 'Can view inward supplies and match purchase ITC', category: 'Compliance & Returns' },
  { key: 'compliance:gst3b', label: 'GSTR-3B Tax Liability', description: 'Can calculate monthly GST liability and export JSON', category: 'Compliance & Returns' },
  { key: 'compliance:eway_bill', label: 'Generate E-Way Bill', description: 'Can generate and download official NIC E-Way Bill JSON', category: 'Compliance & Returns' },
  { key: 'compliance:tds_tcs', label: 'TDS & TCS Compliance', description: 'Can manage TDS/TCS registers, Form 26Q/27EQ, Challan 281', category: 'Compliance & Returns' },

  // Payroll & HR
  { key: 'payroll:manage_employees', label: 'Manage Employees', description: 'Can add and update employee profiles, PAN, UAN, ESIC', category: 'Payroll & HR' },
  { key: 'payroll:process_salary', label: 'Process Monthly Payroll', description: 'Can run monthly payroll with auto EPF, ESI, and PT', category: 'Payroll & HR' },
  { key: 'payroll:view_payslips', label: 'View & Print Payslips', description: 'Can view and print official employee payslips', category: 'Payroll & HR' },

  // System & Users
  { key: 'users:manage_roles', label: 'Manage Roles & Rights', description: 'Can grant or revoke specific permissions for roles', category: 'System & Users' },
  { key: 'users:manage_users', label: 'Manage ERP Users', description: 'Can create user accounts and assign operational roles', category: 'System & Users' }
];

export function hasPermission(user: ERPUser | null | undefined, permission: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
