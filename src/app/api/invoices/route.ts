import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { calculateGSTLineItem } from '@/lib/gst-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const direction = searchParams.get('direction'); // 'OUTWARD' or 'INWARD'

    let queryText = `
      SELECT 
        i.*,
        u.full_name as created_by_name,
        json_agg(
          json_build_object(
            'id', ii.id,
            'item_id', ii.item_id,
            'product_name', ii.product_name,
            'hsn_code', ii.hsn_code,
            'primary_qty', ii.primary_qty,
            'primary_unit', ii.primary_unit,
            'secondary_qty', ii.secondary_qty,
            'secondary_unit', ii.secondary_unit,
            'unit_rate', ii.unit_rate,
            'taxable_amount', ii.taxable_amount,
            'gst_rate', ii.gst_rate,
            'cgst_amount', ii.cgst_amount,
            'sgst_amount', ii.sgst_amount,
            'igst_amount', ii.igst_amount,
            'cess_amount', ii.cess_amount,
            'total_amount', ii.total_amount
          )
        ) FILTER (WHERE ii.id IS NOT NULL) AS items
      FROM invoices i
      LEFT JOIN erp_users u ON i.created_by_user_id = u.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    `;

    const params: any[] = [];
    if (direction) {
      queryText += ` WHERE i.direction = $1`;
      params.push(direction);
    }

    queryText += ` GROUP BY i.id, u.full_name ORDER BY i.id DESC;`;

    const res = await pool.query(queryText, params);
    return NextResponse.json({ success: true, invoices: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      direction, // 'OUTWARD' or 'INWARD'
      invoice_type = 'TAX_INVOICE',
      party_name,
      party_gstin,
      party_pan,
      party_state_code,
      place_of_supply,
      party_address,
      party_pincode,
      invoice_date,
      due_date,
      items, // array of line items with multi-units
      tds_section,
      tds_rate = 0,
      tcs_section,
      tcs_rate = 0,
      created_by_user_id = 1,
      // Transport / E-Way Bill fields
      generate_eway_bill = false,
      trans_mode = 1,
      vehicle_no,
      vehicle_type = 'R',
      trans_distance = 50,
      transporter_id,
      transporter_name
    } = body;

    // Get company profile for GST state determination
    const compRes = await client.query('SELECT * FROM company_profile LIMIT 1');
    const company = compRes.rows[0];
    const companyStateCode = company.state_code;

    await client.query('BEGIN');

    // Generate unique Invoice No
    const prefix = direction === 'OUTWARD' ? 'INV/26-27/' : 'PUR/26-27/';
    const countRes = await client.query(`SELECT COUNT(*) FROM invoices WHERE direction = $1`, [direction]);
    const nextSeq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(4, '0');
    const invoice_no = body.invoice_no || `${prefix}${nextSeq}`;

    // Calculate totals across line items
    let taxable_value = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;
    let cess_amount = 0;

    const processedItems: any[] = [];

    for (const itm of items) {
      const pQty = Number(itm.primary_qty) || 0;
      const rate = Number(itm.unit_rate) || 0;
      const lineTaxable = parseFloat((pQty * rate).toFixed(2));
      const gstRate = Number(itm.gst_rate) || 18;
      const cessRate = Number(itm.cess_rate) || 0;

      const calc = calculateGSTLineItem(companyStateCode, party_state_code, lineTaxable, gstRate, cessRate);

      taxable_value += lineTaxable;
      cgst_amount += calc.cgstAmount;
      sgst_amount += calc.sgstAmount;
      igst_amount += calc.igstAmount;
      cess_amount += calc.cessAmount;

      processedItems.push({
        ...itm,
        taxable_amount: lineTaxable,
        cgst_rate: calc.cgstRate,
        sgst_rate: calc.sgstRate,
        igst_rate: calc.igstRate,
        cgst_amount: calc.cgstAmount,
        sgst_amount: calc.sgstAmount,
        igst_amount: calc.igstAmount,
        cess_amount: calc.cessAmount,
        total_amount: calc.totalAmount
      });
    }

    // TDS / TCS Calculation
    let tds_amount = 0;
    if (tds_section && tds_rate > 0) {
      tds_amount = parseFloat(((taxable_value * tds_rate) / 100).toFixed(2));
    }

    let tcs_amount = 0;
    if (tcs_section && tcs_rate > 0) {
      tcs_amount = parseFloat(((taxable_value * tcs_rate) / 100).toFixed(2));
    }

    const preRoundTotal = taxable_value + cgst_amount + sgst_amount + igst_amount + cess_amount + tcs_amount - tds_amount;
    const roundedTotal = Math.round(preRoundTotal);
    const round_off = parseFloat((roundedTotal - preRoundTotal).toFixed(2));
    const total_amount = roundedTotal;

    // E-Way Bill Auto Generation (if requested or amount > 50,000 for inter-state)
    let eway_bill_no = null;
    let eway_bill_date = null;
    let eway_bill_status = 'NOT_APPLICABLE';
    if (generate_eway_bill || (total_amount >= 50000 && direction === 'OUTWARD')) {
      eway_bill_no = `${party_state_code}${Date.now().toString().slice(-10)}`;
      eway_bill_date = new Date();
      eway_bill_status = 'GENERATED';
    }

    // 1. Insert Invoice Header
    const invRes = await client.query(`
      INSERT INTO invoices (
        invoice_no, direction, invoice_type, party_name, party_gstin, party_pan,
        party_state_code, place_of_supply, party_address, party_pincode,
        invoice_date, due_date, taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount,
        tds_amount, tds_section, tcs_amount, tcs_section, round_off, total_amount, status, created_by_user_id,
        eway_bill_no, eway_bill_date, eway_bill_status, trans_mode, vehicle_no, vehicle_type, trans_distance,
        transporter_id, transporter_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING *;
    `, [
      invoice_no, direction, invoice_type, party_name, party_gstin || null, party_pan || null,
      party_state_code, place_of_supply, party_address || '', party_pincode || null,
      invoice_date || new Date().toISOString().split('T')[0],
      due_date || null,
      taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount,
      tds_amount, tds_section || null, tcs_amount, tcs_section || null,
      round_off, total_amount, 'APPROVED', created_by_user_id,
      eway_bill_no, eway_bill_date, eway_bill_status, trans_mode, vehicle_no || null, vehicle_type,
      trans_distance, transporter_id || null, transporter_name || null
    ]);

    const invoiceId = invRes.rows[0].id;

    // 2. Insert Invoice Line Items and UPDATE INVENTORY (Inventory-wise integration!)
    for (const pitm of processedItems) {
      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, item_id, product_name, hsn_code,
          primary_qty, primary_unit, secondary_qty, secondary_unit,
          unit_rate, taxable_amount, gst_rate, cgst_rate, sgst_rate, igst_rate,
          cgst_amount, sgst_amount, igst_amount, cess_rate, cess_amount, total_amount
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        );
      `, [
        invoiceId,
        pitm.item_id || null,
        pitm.product_name,
        pitm.hsn_code,
        pitm.primary_qty,
        pitm.primary_unit,
        pitm.secondary_qty || null,
        pitm.secondary_unit || null,
        pitm.unit_rate,
        pitm.taxable_amount,
        pitm.gst_rate,
        pitm.cgst_rate,
        pitm.sgst_rate,
        pitm.igst_rate,
        pitm.cgst_amount,
        pitm.sgst_amount,
        pitm.igst_amount,
        pitm.cess_rate || 0,
        pitm.cess_amount || 0,
        pitm.total_amount
      ]);

      // INVENTORY UPDATE:
      if (pitm.item_id) {
        const qtyMultiplier = direction === 'OUTWARD' ? -1 : 1;
        const pQtyChange = Number(pitm.primary_qty) * qtyMultiplier;
        const sQtyChange = (Number(pitm.secondary_qty) || 0) * qtyMultiplier;

        await client.query(`
          UPDATE stock_items
          SET current_stock_primary = current_stock_primary + $1,
              current_stock_secondary = COALESCE(current_stock_secondary, 0) + $2
          WHERE id = $3;
        `, [pQtyChange, sQtyChange, pitm.item_id]);
      }
    }

    // 3. AUTOMATIC DOUBLE-ENTRY JOURNAL ENTRY POSTING
    // Find system ledgers
    const ledgerMapRes = await client.query(`SELECT id, code, name FROM ledgers WHERE is_system = TRUE;`);
    const lMap = new Map<string, number>();
    ledgerMapRes.rows.forEach(r => lMap.set(r.code, r.id));

    const debtorLedgerId = lMap.get('1010'); // Sundry Debtors
    const creditorLedgerId = lMap.get('2001'); // Sundry Creditors
    const salesLedgerId = lMap.get('4001'); // Sales A/c
    const purchaseLedgerId = lMap.get('5001'); // Purchase A/c
    const outCgstLedgerId = lMap.get('2010'); // Output CGST
    const outSgstLedgerId = lMap.get('2011'); // Output SGST
    const outIgstLedgerId = lMap.get('2012'); // Output IGST
    const inCgstLedgerId = lMap.get('1030'); // Input CGST
    const inSgstLedgerId = lMap.get('1031'); // Input SGST
    const inIgstLedgerId = lMap.get('1032'); // Input IGST

    const voucherType = direction === 'OUTWARD' ? 'SALES' : 'PURCHASE';
    const vRes = await client.query(`
      INSERT INTO journal_vouchers (voucher_no, voucher_type, voucher_date, reference_no, narration, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
    `, [
      `VCH-${invoice_no.replace(/\//g, '-')}`,
      voucherType,
      invoice_date || new Date().toISOString().split('T')[0],
      invoice_no,
      `${direction === 'OUTWARD' ? 'Sales' : 'Purchase'} invoice for ${party_name}`,
      created_by_user_id
    ]);
    const voucherId = vRes.rows[0].id;

    if (direction === 'OUTWARD') {
      // Dr. Customer (Total Amount)
      if (debtorLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, $3, 0, $4);`,
          [voucherId, debtorLedgerId, total_amount, `Receivable from ${party_name}`]);
      }
      // Cr. Sales Account (Taxable Value)
      if (salesLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, 0, $3, $4);`,
          [voucherId, salesLedgerId, taxable_value, 'Sales revenue']);
      }
      // Cr. Output CGST / SGST / IGST
      if (cgst_amount > 0 && outCgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, 0, $3, $4);`,
          [voucherId, outCgstLedgerId, cgst_amount, 'Output CGST']);
      }
      if (sgst_amount > 0 && outSgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, 0, $3, $4);`,
          [voucherId, outSgstLedgerId, sgst_amount, 'Output SGST']);
      }
      if (igst_amount > 0 && outIgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, 0, $3, $4);`,
          [voucherId, outIgstLedgerId, igst_amount, 'Output IGST']);
      }
    } else {
      // Inward Supply (Purchase)
      // Dr. Purchases (Taxable Value)
      if (purchaseLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, $3, 0, $4);`,
          [voucherId, purchaseLedgerId, taxable_value, 'Goods purchased']);
      }
      // Dr. Input Tax Credits
      if (cgst_amount > 0 && inCgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, $3, 0, $4);`,
          [voucherId, inCgstLedgerId, cgst_amount, 'Input CGST ITC']);
      }
      if (sgst_amount > 0 && inSgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, $3, 0, $4);`,
          [voucherId, inSgstLedgerId, sgst_amount, 'Input SGST ITC']);
      }
      if (igst_amount > 0 && inIgstLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, $3, 0, $4);`,
          [voucherId, inIgstLedgerId, igst_amount, 'Input IGST ITC']);
      }
      // Cr. Creditor (Total Amount)
      if (creditorLedgerId) {
        await client.query(`INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration) VALUES ($1, $2, 0, $3, $4);`,
          [voucherId, creditorLedgerId, total_amount, `Payable to ${party_name}`]);
      }
    }

    // 4. TDS Register Entry if TDS was deducted
    if (tds_amount > 0 && tds_section) {
      await client.query(`
        INSERT INTO tds_tcs_entries (
          nature_type, old_section, new_section, return_code, party_name, party_pan,
          invoice_ref, transaction_date, booking_amount, tax_rate, tax_deducted, form_type, quarter, financial_year, is_paid
        ) VALUES (
          'TDS', $1, '393(1)', '1031', $2, $3, $4, $5, $6, $7, $8, '26Q', 'Q3', '2026-27', FALSE
        );
      `, [tds_section, party_name, party_pan || 'AAACT2345K', invoice_no, invoice_date || new Date().toISOString().split('T')[0], taxable_value, tds_rate, tds_amount]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      invoice: invRes.rows[0],
      items: processedItems,
      eway_bill: eway_bill_no ? { eway_bill_no, eway_bill_date, eway_bill_status } : null
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
