import pool from './db';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('--- Initializing Database Schema in Supabase PostgreSQL ---');

    await client.query(`
      -- 1. Company Profile Table
      CREATE TABLE IF NOT EXISTS company_profile (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        trade_name VARCHAR(150),
        gstin VARCHAR(15) NOT NULL,
        pan VARCHAR(10) NOT NULL,
        tan VARCHAR(10),
        address_line1 VARCHAR(150) NOT NULL,
        address_line2 VARCHAR(150),
        city VARCHAR(60) NOT NULL,
        state_name VARCHAR(60) NOT NULL,
        state_code INT NOT NULL,
        pincode INT NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        bank_name VARCHAR(100),
        bank_account_no VARCHAR(50),
        bank_ifsc VARCHAR(20),
        bank_branch VARCHAR(60),
        lut_arn VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Users and Roles
      CREATE TABLE IF NOT EXISTS erp_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(40) NOT NULL,
        department VARCHAR(50),
        permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Ledgers / Chart of Accounts
      CREATE TABLE IF NOT EXISTS ledgers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        group_type VARCHAR(50) NOT NULL, -- Current Assets, Current Liabilities, Fixed Assets, Direct Incomes, etc.
        balance_type VARCHAR(2) NOT NULL DEFAULT 'DR', -- DR or CR
        opening_balance NUMERIC(15, 2) DEFAULT 0,
        current_balance NUMERIC(15, 2) DEFAULT 0,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Stock Items with Multiple Units (Compound or Loose/Variable)
      CREATE TABLE IF NOT EXISTS stock_items (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(40) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(60),
        hsn_code VARCHAR(10) NOT NULL,
        primary_unit VARCHAR(10) NOT NULL, -- e.g. BOX, BAG, MTS, KGS, PCS
        secondary_unit VARCHAR(10),       -- e.g. PCS, KGS, MTR
        unit_relation_type VARCHAR(20) NOT NULL DEFAULT 'FIXED_COMPOUND', -- 'FIXED_COMPOUND' or 'LOOSE_VARIABLE'
        conversion_factor NUMERIC(12, 4) DEFAULT 1, -- e.g., 1 Box = 24 Pcs, or 0/null for loose
        opening_stock_primary NUMERIC(15, 4) DEFAULT 0,
        opening_stock_secondary NUMERIC(15, 4) DEFAULT 0,
        current_stock_primary NUMERIC(15, 4) DEFAULT 0,
        current_stock_secondary NUMERIC(15, 4) DEFAULT 0,
        cost_price NUMERIC(15, 2) DEFAULT 0,
        selling_price NUMERIC(15, 2) DEFAULT 0,
        gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
        cess_rate NUMERIC(5, 2) DEFAULT 0,
        min_reorder_level NUMERIC(15, 2) DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Invoices (Sales & Purchases)
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_no VARCHAR(40) UNIQUE NOT NULL,
        direction VARCHAR(10) NOT NULL, -- 'OUTWARD' (Sale) or 'INWARD' (Purchase)
        invoice_type VARCHAR(20) NOT NULL DEFAULT 'TAX_INVOICE', -- 'TAX_INVOICE', 'BILL_OF_SUPPLY', 'EXPORT', 'CHALLAN'
        party_name VARCHAR(150) NOT NULL,
        party_gstin VARCHAR(15),
        party_pan VARCHAR(10),
        party_state_code INT NOT NULL,
        place_of_supply VARCHAR(60) NOT NULL,
        party_address TEXT,
        party_pincode INT,
        invoice_date DATE NOT NULL,
        due_date DATE,
        taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
        cgst_amount NUMERIC(15, 2) DEFAULT 0,
        sgst_amount NUMERIC(15, 2) DEFAULT 0,
        igst_amount NUMERIC(15, 2) DEFAULT 0,
        cess_amount NUMERIC(15, 2) DEFAULT 0,
        tds_amount NUMERIC(15, 2) DEFAULT 0,
        tds_section VARCHAR(20),
        tcs_amount NUMERIC(15, 2) DEFAULT 0,
        tcs_section VARCHAR(20),
        round_off NUMERIC(6, 2) DEFAULT 0,
        total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'APPROVED', -- 'DRAFT', 'APPROVED', 'PAID', 'CANCELLED'
        created_by_user_id INT REFERENCES erp_users(id),
        eway_bill_no VARCHAR(20),
        eway_bill_date TIMESTAMP,
        eway_bill_status VARCHAR(20),
        trans_mode INT DEFAULT 1, -- 1 Road, 2 Rail, 3 Air, 4 Ship
        vehicle_no VARCHAR(20),
        vehicle_type VARCHAR(5) DEFAULT 'R',
        trans_distance INT DEFAULT 50,
        transporter_id VARCHAR(15),
        transporter_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. Invoice Line Items with Multi-Unit recording
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        item_id INT REFERENCES stock_items(id),
        product_name VARCHAR(150) NOT NULL,
        hsn_code VARCHAR(10) NOT NULL,
        primary_qty NUMERIC(15, 4) NOT NULL DEFAULT 0,
        primary_unit VARCHAR(10) NOT NULL,
        secondary_qty NUMERIC(15, 4) DEFAULT 0,
        secondary_unit VARCHAR(10),
        unit_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
        taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
        cgst_rate NUMERIC(5, 2) DEFAULT 0,
        sgst_rate NUMERIC(5, 2) DEFAULT 0,
        igst_rate NUMERIC(5, 2) DEFAULT 0,
        cgst_amount NUMERIC(15, 2) DEFAULT 0,
        sgst_amount NUMERIC(15, 2) DEFAULT 0,
        igst_amount NUMERIC(15, 2) DEFAULT 0,
        cess_rate NUMERIC(5, 2) DEFAULT 0,
        cess_amount NUMERIC(15, 2) DEFAULT 0,
        total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0
      );

      -- 7. Journal Entries (Double-Entry Engine)
      CREATE TABLE IF NOT EXISTS journal_vouchers (
        id SERIAL PRIMARY KEY,
        voucher_no VARCHAR(40) UNIQUE NOT NULL,
        voucher_type VARCHAR(20) NOT NULL, -- 'SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA', 'PAYROLL'
        voucher_date DATE NOT NULL,
        reference_no VARCHAR(50),
        narration TEXT,
        created_by INT REFERENCES erp_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS journal_items (
        id SERIAL PRIMARY KEY,
        voucher_id INT NOT NULL REFERENCES journal_vouchers(id) ON DELETE CASCADE,
        ledger_id INT NOT NULL REFERENCES ledgers(id),
        debit NUMERIC(15, 2) DEFAULT 0,
        credit NUMERIC(15, 2) DEFAULT 0,
        narration TEXT
      );

      -- 8. Employee & HRMS Details
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        emp_code VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        designation VARCHAR(60) NOT NULL,
        department VARCHAR(50) NOT NULL,
        date_of_joining DATE NOT NULL,
        pan VARCHAR(10) NOT NULL,
        uan VARCHAR(12), -- Universal Account Number for EPF
        pf_number VARCHAR(30),
        esic_number VARCHAR(17),
        bank_name VARCHAR(60),
        bank_account_no VARCHAR(40),
        bank_ifsc VARCHAR(15),
        basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        hra NUMERIC(12, 2) NOT NULL DEFAULT 0,
        special_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
        gross_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        is_pf_eligible BOOLEAN DEFAULT TRUE,
        is_esi_eligible BOOLEAN DEFAULT TRUE,
        is_pt_eligible BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. Payroll Calculation & Payslips
      CREATE TABLE IF NOT EXISTS payroll_records (
        id SERIAL PRIMARY KEY,
        month VARCHAR(10) NOT NULL, -- '2026-10'
        employee_id INT NOT NULL REFERENCES employees(id),
        working_days INT DEFAULT 30,
        present_days NUMERIC(4, 1) DEFAULT 30,
        basic_earned NUMERIC(12, 2) NOT NULL,
        hra_earned NUMERIC(12, 2) NOT NULL,
        special_allowance_earned NUMERIC(12, 2) NOT NULL,
        gross_earned NUMERIC(12, 2) NOT NULL,
        -- Statutory Deductions
        epf_employee NUMERIC(10, 2) DEFAULT 0, -- 12% of Basic (subject to cap)
        epf_employer NUMERIC(10, 2) DEFAULT 0, -- 3.67% EPF + 8.33% EPS
        esi_employee NUMERIC(10, 2) DEFAULT 0, -- 0.75% of Gross (if Gross <= 21000)
        esi_employer NUMERIC(10, 2) DEFAULT 0, -- 3.25% of Gross
        professional_tax NUMERIC(10, 2) DEFAULT 200, -- PT
        tds_deducted NUMERIC(10, 2) DEFAULT 0,       -- Section 192
        other_deductions NUMERIC(10, 2) DEFAULT 0,
        total_deductions NUMERIC(12, 2) NOT NULL,
        net_payable NUMERIC(12, 2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'PENDING',
        payment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. TDS & TCS Register (Compliant with Tax Year 2026-27 & New IT Act 2025 Sections 392, 393, 394)
      CREATE TABLE IF NOT EXISTS tds_tcs_entries (
        id SERIAL PRIMARY KEY,
        nature_type VARCHAR(10) NOT NULL, -- 'TDS' or 'TCS'
        old_section VARCHAR(20) NOT NULL,  -- e.g. '194C', '194J', '194I', '194Q', '206C'
        new_section VARCHAR(20),          -- e.g. '393(1)', '394(1)'
        return_code VARCHAR(10) NOT NULL, -- e.g. '1023', '1024', '1027', '1031', '1073'
        party_name VARCHAR(150) NOT NULL,
        party_pan VARCHAR(10) NOT NULL,
        invoice_ref VARCHAR(40),
        transaction_date DATE NOT NULL,
        booking_amount NUMERIC(15, 2) NOT NULL,
        tax_rate NUMERIC(5, 2) NOT NULL,
        tax_deducted NUMERIC(15, 2) NOT NULL,
        challan_bsr_code VARCHAR(10),
        challan_no VARCHAR(10),
        challan_date DATE,
        form_type VARCHAR(10) DEFAULT '26Q', -- 26Q, 27EQ, 24Q
        quarter VARCHAR(5) DEFAULT 'Q3',    -- Q1, Q2, Q3, Q4
        financial_year VARCHAR(10) DEFAULT '2026-27',
        is_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables verified and created successfully.');

    // Seed Initial Company Profile if empty
    const compCheck = await client.query('SELECT COUNT(*) FROM company_profile');
    if (parseInt(compCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO company_profile (
          company_name, trade_name, gstin, pan, tan, 
          address_line1, address_line2, city, state_name, state_code, pincode, 
          email, phone, bank_name, bank_account_no, bank_ifsc, bank_branch, lut_arn
        ) VALUES (
          'BHARAT HEAVY ENGINEERING & METALS PVT LTD',
          'BHARAT METALS',
          '27AAACB2233P1Z2',
          'AAACB2233P',
          'PNEB12345C',
          'Plot No. 45, Hadapsar Industrial Estate, Pune-Solapur Road',
          'Phase II, Hadapsar',
          'Pune',
          'MAHARASHTRA',
          27,
          411013,
          'accounts@bharatmetals.in',
          '+91 20 2687 4500',
          'HDFC Bank Ltd',
          '50200088992211',
          'HDFC0000123',
          'Hadapsar Pune Branch',
          'AD270426001234F'
        );
      `);
      console.log('Seeded Company Profile.');
    }

    // Seed Standard Roles and Users if empty
    const userCheck = await client.query('SELECT COUNT(*) FROM erp_users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO erp_users (username, password_hash, full_name, email, role, department, permissions)
        VALUES 
        ('admin', 'admin123', 'Rajesh Sharma (MD & Super Admin)', 'rajesh.sharma@bharatmetals.in', 'SUPER_ADMIN', 'Executive', 
         '["invoices:create", "invoices:view", "invoices:edit", "invoices:delete", "invoices:approve", "invoices:print", "purchases:create", "purchases:view", "purchases:edit", "ledgers:create", "ledgers:view", "ledgers:edit", "vouchers:create", "vouchers:view", "reports:balance_sheet", "reports:profit_loss", "reports:trial_balance", "reports:daybook", "inventory:create_item", "inventory:view_stock", "inventory:adjust_stock", "compliance:gst1", "compliance:gst2", "compliance:gst3b", "compliance:eway_bill", "compliance:tds_tcs", "payroll:manage_employees", "payroll:process_salary", "payroll:view_payslips", "users:manage_roles", "users:manage_users"]'::jsonb),

        ('accountant', 'acc123', 'Priya Patel (Sr. Chartered Accountant)', 'priya.patel@bharatmetals.in', 'SENIOR_ACCOUNTANT', 'Finance & Accounts', 
         '["invoices:create", "invoices:view", "invoices:edit", "invoices:approve", "invoices:print", "purchases:create", "purchases:view", "purchases:edit", "ledgers:create", "ledgers:view", "ledgers:edit", "vouchers:create", "vouchers:view", "reports:balance_sheet", "reports:profit_loss", "reports:trial_balance", "reports:daybook", "inventory:view_stock", "compliance:gst1", "compliance:gst2", "compliance:gst3b", "compliance:eway_bill", "compliance:tds_tcs", "payroll:view_payslips"]'::jsonb),

        ('billing', 'bill123', 'Amit Kumar (Billing & Sales Executive)', 'amit.kumar@bharatmetals.in', 'BILLING_EXECUTIVE', 'Sales & Dispatch', 
         '["invoices:create", "invoices:view", "invoices:print", "compliance:eway_bill", "inventory:view_stock"]'::jsonb),

        ('storekeeper', 'store123', 'Vikram Singh (Store & Inventory Head)', 'vikram.singh@bharatmetals.in', 'INVENTORY_MANAGER', 'Warehouse & Logistics', 
         '["inventory:create_item", "inventory:view_stock", "inventory:adjust_stock", "purchases:view", "compliance:eway_bill"]'::jsonb),

        ('hrmanager', 'hr123', 'Anita Desai (HR & Labor Compliance)', 'anita.desai@bharatmetals.in', 'HR_PAYROLL_MANAGER', 'Human Resources', 
         '["payroll:manage_employees", "payroll:process_salary", "payroll:view_payslips"]'::jsonb),

        ('auditor', 'audit123', 'Sunil Verma (Statutory Tax Auditor)', 'sunil.verma@cacas.com', 'TAX_AUDITOR', 'Audit & Assurance', 
         '["invoices:view", "purchases:view", "ledgers:view", "vouchers:view", "reports:balance_sheet", "reports:profit_loss", "reports:trial_balance", "reports:daybook", "compliance:gst1", "compliance:gst2", "compliance:gst3b", "compliance:eway_bill", "compliance:tds_tcs", "payroll:view_payslips"]'::jsonb);
      `);
      console.log('Seeded Users with granular permissions.');
    }

    // Seed Standard Indian Chart of Accounts (Ledgers)
    const ledgerCheck = await client.query('SELECT COUNT(*) FROM ledgers');
    if (parseInt(ledgerCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO ledgers (code, name, group_type, balance_type, opening_balance, current_balance, is_system)
        VALUES
        ('1001', 'Cash in Hand', 'Current Assets', 'DR', 50000.00, 50000.00, TRUE),
        ('1002', 'HDFC Bank Current Account', 'Current Assets', 'DR', 1250000.00, 1250000.00, TRUE),
        ('1003', 'State Bank of India (SBI) A/c', 'Current Assets', 'DR', 450000.00, 450000.00, TRUE),
        ('1010', 'Sundry Debtors (Trade Receivables)', 'Current Assets', 'DR', 850000.00, 850000.00, TRUE),
        ('1020', 'Closing Stock Inventory', 'Current Assets', 'DR', 1840000.00, 1840000.00, TRUE),
        ('1030', 'Input CGST Account', 'Current Assets', 'DR', 45000.00, 45000.00, TRUE),
        ('1031', 'Input SGST Account', 'Current Assets', 'DR', 45000.00, 45000.00, TRUE),
        ('1032', 'Input IGST Account', 'Current Assets', 'DR', 90000.00, 90000.00, TRUE),
        ('1040', 'Advance Tax / TDS Receivable', 'Current Assets', 'DR', 25000.00, 25000.00, TRUE),
        ('1501', 'Plant & Machinery', 'Fixed Assets', 'DR', 3500000.00, 3500000.00, FALSE),
        ('1502', 'Factory Building', 'Fixed Assets', 'DR', 4500000.00, 4500000.00, FALSE),
        ('2001', 'Sundry Creditors (Trade Payables)', 'Current Liabilities', 'CR', 620000.00, 620000.00, TRUE),
        ('2010', 'Output CGST Account', 'Current Liabilities', 'CR', 55000.00, 55000.00, TRUE),
        ('2011', 'Output SGST Account', 'Current Liabilities', 'CR', 55000.00, 55000.00, TRUE),
        ('2012', 'Output IGST Account', 'Current Liabilities', 'CR', 110000.00, 110000.00, TRUE),
        ('2020', 'TDS Payable (Sec 194C/J/I/Q)', 'Current Liabilities', 'CR', 18500.00, 18500.00, TRUE),
        ('2021', 'TCS Payable (Sec 206C)', 'Current Liabilities', 'CR', 4500.00, 4500.00, TRUE),
        ('2030', 'EPF Payable (Provident Fund)', 'Current Liabilities', 'CR', 28800.00, 28800.00, TRUE),
        ('2031', 'ESI Payable (Employee State Ins.)', 'Current Liabilities', 'CR', 4800.00, 4800.00, TRUE),
        ('2032', 'Professional Tax Payable', 'Current Liabilities', 'CR', 1200.00, 1200.00, TRUE),
        ('2040', 'Salaries & Wages Payable', 'Current Liabilities', 'CR', 0.00, 0.00, TRUE),
        ('2501', 'HDFC Bank Term Loan', 'Long-term Liabilities', 'CR', 2000000.00, 2000000.00, FALSE),
        ('3001', 'Share Capital Account', 'Capital / Equity', 'CR', 5000000.00, 5000000.00, TRUE),
        ('3002', 'Retained Earnings / Reserves', 'Capital / Equity', 'CR', 4381000.00, 4381000.00, TRUE),
        ('4001', 'Domestic Sales Account (GST 18%)', 'Direct Incomes', 'CR', 0.00, 0.00, TRUE),
        ('4002', 'Inter-State Sales Account (IGST)', 'Direct Incomes', 'CR', 0.00, 0.00, TRUE),
        ('4003', 'Scrap Sales Account', 'Direct Incomes', 'CR', 0.00, 0.00, TRUE),
        ('5001', 'Domestic Purchases Account', 'Direct Expenses', 'DR', 0.00, 0.00, TRUE),
        ('5002', 'Freight & Inward Cartage', 'Direct Expenses', 'DR', 0.00, 0.00, FALSE),
        ('5003', 'Factory Power & Fuel', 'Direct Expenses', 'DR', 0.00, 0.00, FALSE),
        ('6001', 'Employee Salaries & Wages', 'Indirect Expenses', 'DR', 0.00, 0.00, TRUE),
        ('6002', 'Employer PF Contribution Exp.', 'Indirect Expenses', 'DR', 0.00, 0.00, TRUE),
        ('6003', 'Employer ESI Contribution Exp.', 'Indirect Expenses', 'DR', 0.00, 0.00, TRUE),
        ('6004', 'Factory & Office Rent', 'Indirect Expenses', 'DR', 0.00, 0.00, FALSE),
        ('6005', 'Legal & Professional Charges', 'Indirect Expenses', 'DR', 0.00, 0.00, FALSE),
        ('6006', 'Office Printing & Stationery', 'Indirect Expenses', 'DR', 0.00, 0.00, FALSE);
      `);
      console.log('Seeded Indian Chart of Accounts.');
    }

    // Seed Stock Items with Multi-Unit support (Compound and Loose/Variable)
    const itemCheck = await client.query('SELECT COUNT(*) FROM stock_items');
    if (parseInt(itemCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO stock_items (
          sku, name, description, category, hsn_code, 
          primary_unit, secondary_unit, unit_relation_type, conversion_factor,
          opening_stock_primary, opening_stock_secondary, current_stock_primary, current_stock_secondary,
          cost_price, selling_price, gst_rate, cess_rate, min_reorder_level
        ) VALUES 
        -- 1. Compound fixed ratio (1 BOX = 24 PCS)
        ('ITM-FAST-01', 'High Tensile Hex Bolts M16 x 60mm', 'Grade 8.8 Galvanized Hex Bolts with Nuts', 'Industrial Fasteners', '73181500',
         'BOX', 'PCS', 'FIXED_COMPOUND', 24.0000, 200, 4800, 185, 4440, 450.00, 680.00, 18.00, 0, 30),
        
        -- 2. Loose / Variable Unrelated Unit (BAGS of loose Iron Scrap/Pyrites where weight varies per bag, e.g. bags with kg recorded independently)
        ('ITM-SCRAP-02', 'Heavy Melting Steel Scrap (HMS 1&2)', 'Industrial structural steel cutting scrap packed in bags', 'Raw Material & Scrap', '72044900',
         'BAG', 'KGS', 'LOOSE_VARIABLE', 0.0000, 150, 7840.5000, 142, 7390.2500, 32.00, 42.50, 18.00, 0, 25),

        -- 3. Metric Ton & Kilogram Compound (1 MTS = 1000 KGS)
        ('ITM-STEEL-03', 'TMT Rebars Fe 550D - 12mm', 'Primary Grade Thermomechanically Treated Rebars', 'Construction Steel', '72142090',
         'MTS', 'KGS', 'FIXED_COMPOUND', 1000.0000, 45, 45000, 38.5, 38500, 46000.00, 56500.00, 18.00, 0, 10),

        -- 4. Single Unit / Standard (PCS)
        ('ITM-VALVE-04', 'Cast Steel Gate Valve 4 Inch Class 150', 'Flanged End Industrial Gate Valve IBR Approved', 'Valves & Fittings', '84818030',
         'PCS', NULL, 'FIXED_COMPOUND', 1.0000, 60, NULL, 52, NULL, 4800.00, 7200.00, 18.00, 0, 10),

        -- 5. Chemical Drum & Litre (1 DRM = 200 LTR)
        ('ITM-OIL-05', 'Industrial Hydraulic Oil ISO VG 68', 'High performance anti-wear circulating oil', 'Lubricants', '27101980',
         'DRM', 'LTR', 'FIXED_COMPOUND', 200.0000, 25, 5000, 21, 4200, 22000.00, 28500.00, 18.00, 0, 5);
      `);
      console.log('Seeded Stock items with multi-units.');
    }

    // Seed Sample Employees
    const empCheck = await client.query('SELECT COUNT(*) FROM employees');
    if (parseInt(empCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO employees (
          emp_code, full_name, designation, department, date_of_joining,
          pan, uan, pf_number, esic_number, bank_name, bank_account_no, bank_ifsc,
          basic_salary, hra, special_allowance, gross_salary, is_pf_eligible, is_esi_eligible, is_pt_eligible
        ) VALUES 
        ('EMP001', 'Sunil Ramesh Rao', 'Senior CNC Machine Operator', 'Production', '2022-04-10',
         'BPZPR1234F', '101234567890', 'MH/PUN/0012345/000/000101', '31234567890123456', 'State Bank of India', '30291827364', 'SBIN0001234',
         18500.00, 7400.00, 4100.00, 30000.00, TRUE, FALSE, TRUE),

        ('EMP002', 'Kavita Suresh Jagtap', 'Junior Quality Inspector', 'Quality Control', '2023-01-15',
         'AGKPJ5678K', '101234567891', 'MH/PUN/0012345/000/000102', '31234567890123457', 'HDFC Bank Ltd', '501002345678', 'HDFC0000123',
         12000.00, 4800.00, 2700.00, 19500.00, TRUE, TRUE, TRUE),

        ('EMP003', 'Manoj Kumar Tiwari', 'Plant Maintenance Fitter', 'Maintenance', '2021-08-01',
         'CPDPT9012M', '101234567892', 'MH/PUN/0012345/000/000103', '31234567890123458', 'Bank of Baroda', '01290100012345', 'BARB0HADAPS',
         11000.00, 4400.00, 2600.00, 18000.00, TRUE, TRUE, TRUE),

        ('EMP004', 'Deepak Vasant Shinde', 'Accounts Officer', 'Finance', '2020-03-01',
         'BTYPS4321A', '101234567893', 'MH/PUN/0012345/000/000104', '31234567890123459', 'ICICI Bank Ltd', '001201567890', 'ICIC0000012',
         28000.00, 11200.00, 5800.00, 45000.00, TRUE, FALSE, TRUE);
      `);
      console.log('Seeded Employee master records.');
    }

    // Seed Sample Invoices (Both Intra-state Maharashtra & Inter-state Gujarat/Karnataka)
    const invCheck = await client.query('SELECT COUNT(*) FROM invoices');
    if (parseInt(invCheck.rows[0].count) === 0) {
      // 1. Sales Invoice Intra-state (CGST + SGST)
      const inv1 = await client.query(`
        INSERT INTO invoices (
          invoice_no, direction, invoice_type, party_name, party_gstin, party_pan,
          party_state_code, place_of_supply, party_address, party_pincode,
          invoice_date, due_date, taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount,
          round_off, total_amount, status, created_by_user_id,
          eway_bill_no, eway_bill_date, eway_bill_status, trans_mode, vehicle_no, vehicle_type, trans_distance, transporter_name
        ) VALUES (
          'INV/26-27/0042', 'OUTWARD', 'TAX_INVOICE', 'Kirloskar Engineering Works Ltd', '27AAACK1234L1Z1', 'AAACK1234L',
          27, '27-MAHARASHTRA', 'Plot 18, Bhosari MIDC, Pune', 411026,
          '2026-10-15', '2026-11-14', 165000.00, 14850.00, 14850.00, 0.00, 0.00,
          0.00, 194700.00, 'APPROVED', 1,
          '271049283741', '2026-10-15 11:30:00', 'GENERATED', 1, 'MH12RN4590', 'R', 45, 'VRL Logistics Ltd'
        ) RETURNING id;
      `);

      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, item_id, product_name, hsn_code, primary_qty, primary_unit, secondary_qty, secondary_unit,
          unit_rate, taxable_amount, gst_rate, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        ) VALUES (
          ${inv1.rows[0].id}, 1, 'High Tensile Hex Bolts M16 x 60mm', '73181500', 150, 'BOX', 3600, 'PCS',
          680.00, 102000.00, 18.00, 9.00, 9.00, 0.00, 9180.00, 9180.00, 0.00, 120360.00
        ),
        (
          ${inv1.rows[0].id}, 4, 'Cast Steel Gate Valve 4 Inch Class 150', '84818030', 8.75, 'PCS', NULL, NULL,
          7200.00, 63000.00, 18.00, 9.00, 9.00, 0.00, 5670.00, 5670.00, 0.00, 74340.00
        );
      `);

      // 2. Sales Invoice Inter-state (IGST) to Gujarat
      const inv2 = await client.query(`
        INSERT INTO invoices (
          invoice_no, direction, invoice_type, party_name, party_gstin, party_pan,
          party_state_code, place_of_supply, party_address, party_pincode,
          invoice_date, due_date, taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount,
          round_off, total_amount, status, created_by_user_id,
          eway_bill_no, eway_bill_date, eway_bill_status, trans_mode, vehicle_no, vehicle_type, trans_distance, transporter_name
        ) VALUES (
          'INV/26-27/0043', 'OUTWARD', 'TAX_INVOICE', 'Gujarat Heavy Infra Project Corp', '24AAACG9876Q1Z9', 'AAACG9876Q',
          24, '24-GUJARAT', 'Survey 112, GIDC Vatva, Ahmedabad', 382445,
          '2026-10-18', '2026-11-17', 565000.00, 0.00, 0.00, 101700.00, 0.00,
          0.00, 666700.00, 'APPROVED', 1,
          '241088492019', '2026-10-18 16:45:00', 'GENERATED', 1, 'GJ01AB9871', 'R', 640, 'TCI Express Ltd'
        ) RETURNING id;
      `);

      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, item_id, product_name, hsn_code, primary_qty, primary_unit, secondary_qty, secondary_unit,
          unit_rate, taxable_amount, gst_rate, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        ) VALUES (
          ${inv2.rows[0].id}, 3, 'TMT Rebars Fe 550D - 12mm', '72142090', 10, 'MTS', 10000, 'KGS',
          56500.00, 565000.00, 18.00, 0.00, 0.00, 18.00, 0.00, 0.00, 101700.00, 666700.00
        );
      `);

      // 3. Purchase Invoice (Inward Supply with TDS 194Q & ITC)
      const inv3 = await client.query(`
        INSERT INTO invoices (
          invoice_no, direction, invoice_type, party_name, party_gstin, party_pan,
          party_state_code, place_of_supply, party_address, party_pincode,
          invoice_date, due_date, taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount,
          tds_amount, tds_section, round_off, total_amount, status, created_by_user_id
        ) VALUES (
          'PUR/26-27/0019', 'INWARD', 'TAX_INVOICE', 'Tata Steel Downstream Products Ltd', '27AAACT2345K1Z3', 'AAACT2345K',
          27, '27-MAHARASHTRA', 'Tata Centre, 43 Jawaharlal Nehru Road, Pune', 411001,
          '2026-10-05', '2026-11-04', 920000.00, 82800.00, 82800.00, 0.00, 0.00,
          920.00, '194Q', 0.00, 1084680.00, 'APPROVED', 2
        ) RETURNING id;
      `);

      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, item_id, product_name, hsn_code, primary_qty, primary_unit, secondary_qty, secondary_unit,
          unit_rate, taxable_amount, gst_rate, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        ) VALUES (
          ${inv3.rows[0].id}, 3, 'TMT Rebars Fe 550D - 12mm', '72142090', 20, 'MTS', 20000, 'KGS',
          46000.00, 920000.00, 18.00, 9.00, 9.00, 0.00, 82800.00, 82800.00, 0.00, 1085600.00
        );
      `);
      console.log('Seeded Sales & Purchase Invoices.');
    }

    // Seed Sample TDS / TCS Entries
    const tdsCheck = await client.query('SELECT COUNT(*) FROM tds_tcs_entries');
    if (parseInt(tdsCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO tds_tcs_entries (
          nature_type, old_section, new_section, return_code, party_name, party_pan,
          invoice_ref, transaction_date, booking_amount, tax_rate, tax_deducted,
          challan_bsr_code, challan_no, challan_date, form_type, quarter, financial_year, is_paid
        ) VALUES 
        -- 194C Contractor (Company 2%)
        ('TDS', '194C', '393(1)', '1024', 'Apex Facility Management Pvt Ltd', 'AAACA7788P', 'EXP/26/102', '2026-10-07', 150000.00, 2.00, 3000.00, '0510302', '01429', '2026-10-12', '26Q', 'Q3', '2026-27', TRUE),
        
        -- 194J(b) Professional Fees (10%)
        ('TDS', '194J(b)', '393(1)', '1027', 'Deshmukh & Associates Legal Advocates', 'AABFD1234D', 'BILL/LGL/88', '2026-10-10', 80000.00, 10.00, 8000.00, '0510302', '01429', '2026-10-12', '26Q', 'Q3', '2026-27', TRUE),

        -- 194I(b) Office Rent (10%)
        ('TDS', '194I(b)', '393(1)', '1009', 'Poonawalla Commercial Properties', 'AAAFP9988G', 'RENT/OCT/26', '2026-10-01', 95000.00, 10.00, 9500.00, '0510302', '01429', '2026-10-12', '26Q', 'Q3', '2026-27', TRUE),

        -- 194Q Purchase of Goods (0.1%)
        ('TDS', '194Q', '393(1)', '1031', 'Tata Steel Downstream Products Ltd', 'AAACT2345K', 'PUR/26-27/0019', '2026-10-05', 920000.00, 0.10, 920.00, NULL, NULL, NULL, '26Q', 'Q3', '2026-27', FALSE),

        -- 206C(E) Scrap TCS (2%)
        ('TCS', '206C - E', '394(1)', '1073', 'Maharashtra Foundry Scrap Buyers', 'AAYFM4455Q', 'SCRAP/26/012', '2026-10-12', 225000.00, 2.00, 4500.00, NULL, NULL, NULL, '27EQ', 'Q3', '2026-27', FALSE);
      `);
      console.log('Seeded TDS/TCS Register Entries.');
    }

    // Seed Sample Payroll Records for Current Month (2026-10)
    const payCheck = await client.query('SELECT COUNT(*) FROM payroll_records');
    if (parseInt(payCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO payroll_records (
          month, employee_id, working_days, present_days, 
          basic_earned, hra_earned, special_allowance_earned, gross_earned,
          epf_employee, epf_employer, esi_employee, esi_employer, professional_tax, tds_deducted, other_deductions,
          total_deductions, net_payable, payment_status, payment_date
        ) VALUES 
        -- EMP001 (Gross 30,000, PF on max 15000 cap = 1800, No ESI as > 21k, PT 200)
        ('2026-10', 1, 30, 30, 18500.00, 7400.00, 4100.00, 30000.00, 1800.00, 1800.00, 0.00, 0.00, 200.00, 500.00, 0.00, 2500.00, 27500.00, 'PAID', '2026-10-20'),
        
        -- EMP002 (Gross 19,500, ESI eligible: Emp 0.75% = 146, Employer 3.25% = 634; PF 12% of 12000 = 1440, PT 200)
        ('2026-10', 2, 30, 29, 11600.00, 4640.00, 2610.00, 18850.00, 1392.00, 1392.00, 141.38, 612.63, 200.00, 0.00, 0.00, 1733.38, 17116.62, 'PAID', '2026-10-20'),

        -- EMP003 (Gross 18,000, ESI eligible: Emp 0.75% = 135, Employer 3.25% = 585; PF 12% of 11000 = 1320, PT 200)
        ('2026-10', 3, 30, 30, 11000.00, 4400.00, 2600.00, 18000.00, 1320.00, 1320.00, 135.00, 585.00, 200.00, 0.00, 0.00, 1655.00, 16345.00, 'PAID', '2026-10-20'),

        -- EMP004 (Gross 45,000, PF 1800 cap, No ESI, PT 200, TDS 1500)
        ('2026-10', 4, 30, 30, 28000.00, 11200.00, 5800.00, 45000.00, 1800.00, 1800.00, 0.00, 0.00, 200.00, 1500.00, 0.00, 3500.00, 41500.00, 'PAID', '2026-10-20');
      `);
      console.log('Seeded Monthly Payroll and Payslip records.');
    }

    console.log('--- Supabase Database Initialization Completed Successfully ---');
    return true;
  } catch (error: any) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    client.release();
  }
}
