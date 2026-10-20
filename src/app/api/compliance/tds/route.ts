import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { TDS_TCS_RATES_2026_27 } from '@/lib/tax-masters';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formType = searchParams.get('formType'); // '26Q', '27EQ', '24Q'
    const quarter = searchParams.get('quarter') || 'Q3';
    const financialYear = searchParams.get('fy') || '2026-27';

    let queryText = `SELECT * FROM tds_tcs_entries WHERE financial_year = $1`;
    const params: any[] = [financialYear];

    if (quarter) {
      params.push(quarter);
      queryText += ` AND quarter = $${params.length}`;
    }

    if (formType) {
      params.push(formType);
      queryText += ` AND form_type = $${params.length}`;
    }

    queryText += ` ORDER BY transaction_date DESC, id DESC;`;

    const res = await pool.query(queryText, params);

    // Calculate Summary Stats
    const totalDeducted = res.rows.reduce((s, r) => s + Number(r.tax_deducted), 0);
    const totalPaid = res.rows.filter(r => r.is_paid).reduce((s, r) => s + Number(r.tax_deducted), 0);
    const totalPending = totalDeducted - totalPaid;

    // Form 26Q formatted structure (ready for ITD quarterly filing utility)
    const form26qRecords = res.rows.filter(r => r.form_type === '26Q').map((r, idx) => ({
      slNo: idx + 1,
      deducteePan: r.party_pan,
      deducteeName: r.party_name,
      sectionCode: r.old_section,
      returnCode: r.return_code,
      newSection: r.new_section,
      dateOfPayment: r.transaction_date,
      amountPaid: Number(r.booking_amount),
      rateOfTax: Number(r.tax_rate),
      taxDeducted: Number(r.tax_deducted),
      challanDetails: r.is_paid ? {
        bsrCode: r.challan_bsr_code,
        challanNo: r.challan_no,
        depositDate: r.challan_date
      } : 'PENDING_DEPOSIT'
    }));

    return NextResponse.json({
      success: true,
      ratesMaster: TDS_TCS_RATES_2026_27,
      entries: res.rows,
      summary: {
        totalDeducted,
        totalPaid,
        totalPending,
        count: res.rows.length
      },
      form26qRecords
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'record_challan') {
      const { entryIds, bsrCode, challanNo, challanDate } = body;
      await pool.query(`
        UPDATE tds_tcs_entries
        SET challan_bsr_code = $1, challan_no = $2, challan_date = $3, is_paid = TRUE
        WHERE id = ANY($4::int[]);
      `, [bsrCode, challanNo, challanDate, entryIds]);

      return NextResponse.json({ success: true, message: 'Challan 281 deposit recorded successfully' });
    }

    if (action === 'add_entry') {
      const {
        nature_type, // 'TDS' or 'TCS'
        old_section,
        new_section,
        return_code,
        party_name,
        party_pan,
        invoice_ref,
        transaction_date = new Date().toISOString().split('T')[0],
        booking_amount,
        tax_rate,
        form_type = '26Q',
        quarter = 'Q3',
        financial_year = '2026-27'
      } = body;

      const tax_deducted = parseFloat(((Number(booking_amount) * Number(tax_rate)) / 100).toFixed(2));

      const res = await pool.query(`
        INSERT INTO tds_tcs_entries (
          nature_type, old_section, new_section, return_code, party_name, party_pan,
          invoice_ref, transaction_date, booking_amount, tax_rate, tax_deducted,
          form_type, quarter, financial_year, is_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)
        RETURNING *;
      `, [
        nature_type, old_section, new_section, return_code, party_name, party_pan,
        invoice_ref || '', transaction_date, booking_amount, tax_rate, tax_deducted,
        form_type, quarter, financial_year
      ]);

      return NextResponse.json({ success: true, entry: res.rows[0] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
