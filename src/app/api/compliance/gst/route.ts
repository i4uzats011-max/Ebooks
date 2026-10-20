import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateGSTR1JSON, generateGSTR3BJSON, generateEwayBillJSON } from '@/lib/gst-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'gstr1', 'gstr2b', 'gstr3b', 'eway_bill', 'overview'
    const invoiceId = searchParams.get('invoiceId');
    const returnPeriod = searchParams.get('fp') || '102026';

    const compRes = await pool.query('SELECT * FROM company_profile LIMIT 1');
    const company = compRes.rows[0];

    // Fetch all invoices with line items
    const invRes = await pool.query(`
      SELECT 
        i.*,
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
            'cgst_rate', ii.cgst_rate,
            'sgst_rate', ii.sgst_rate,
            'igst_rate', ii.igst_rate,
            'cgst_amount', ii.cgst_amount,
            'sgst_amount', ii.sgst_amount,
            'igst_amount', ii.igst_amount,
            'cess_rate', ii.cess_rate,
            'cess_amount', ii.cess_amount,
            'total_amount', ii.total_amount
          )
        ) FILTER (WHERE ii.id IS NOT NULL) AS items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.status != 'CANCELLED'
      GROUP BY i.id
      ORDER BY i.id DESC;
    `);

    const invoices = invRes.rows;

    if (type === 'gstr1') {
      const gstr1 = generateGSTR1JSON(company, invoices, returnPeriod);
      return NextResponse.json({ success: true, returnPeriod, gstr1 });
    }

    if (type === 'gstr3b') {
      const gstr3b = generateGSTR3BJSON(company, invoices, returnPeriod);
      return NextResponse.json({ success: true, returnPeriod, gstr3b });
    }

    if (type === 'gstr2b') {
      // Inward Supplies / ITC Reconciliation
      const inwardInvoices = invoices.filter(i => i.direction === 'INWARD');
      const itcSummary = {
        totalPurchasesCount: inwardInvoices.length,
        totalTaxableValue: inwardInvoices.reduce((s, i) => s + Number(i.taxable_value), 0),
        eligibleItcIgst: inwardInvoices.reduce((s, i) => s + Number(i.igst_amount), 0),
        eligibleItcCgst: inwardInvoices.reduce((s, i) => s + Number(i.cgst_amount), 0),
        eligibleItcSgst: inwardInvoices.reduce((s, i) => s + Number(i.sgst_amount), 0),
        eligibleItcCess: inwardInvoices.reduce((s, i) => s + Number(i.cess_amount || 0), 0),
        inwardInvoices
      };
      return NextResponse.json({ success: true, gstr2b: itcSummary });
    }

    if (type === 'eway_bill' && invoiceId) {
      const targetInvoice = invoices.find(i => i.id === parseInt(invoiceId, 10));
      if (!targetInvoice) {
        return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
      }
      const ewbJSON = generateEwayBillJSON(company, targetInvoice, targetInvoice.items || []);
      return NextResponse.json({ success: true, ewayBill: ewbJSON });
    }

    // Default: Complete GST compliance overview
    const gstr1 = generateGSTR1JSON(company, invoices, returnPeriod);
    const gstr3b = generateGSTR3BJSON(company, invoices, returnPeriod);
    const outwardInvoices = invoices.filter(i => i.direction === 'OUTWARD');
    const inwardInvoices = invoices.filter(i => i.direction === 'INWARD');

    return NextResponse.json({
      success: true,
      company,
      returnPeriod,
      outwardCount: outwardInvoices.length,
      inwardCount: inwardInvoices.length,
      gstr1,
      gstr3b,
      inwardInvoices
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
