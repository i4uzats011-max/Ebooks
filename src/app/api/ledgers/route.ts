import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const ledgersRes = await pool.query(`
      SELECT 
        l.*,
        COALESCE(SUM(ji.debit), 0) AS total_debit,
        COALESCE(SUM(ji.credit), 0) AS total_credit
      FROM ledgers l
      LEFT JOIN journal_items ji ON l.id = ji.ledger_id
      GROUP BY l.id
      ORDER BY l.group_type, l.code;
    `);

    const vouchersRes = await pool.query(`
      SELECT 
        v.*,
        u.full_name as created_by_name,
        json_agg(
          json_build_object(
            'id', ji.id,
            'ledger_id', ji.ledger_id,
            'ledger_name', l.name,
            'debit', ji.debit,
            'credit', ji.credit,
            'narration', ji.narration
          )
        ) as items
      FROM journal_vouchers v
      LEFT JOIN erp_users u ON v.created_by = u.id
      LEFT JOIN journal_items ji ON v.id = ji.voucher_id
      LEFT JOIN ledgers l ON ji.ledger_id = l.id
      GROUP BY v.id, u.full_name
      ORDER BY v.voucher_date DESC, v.id DESC
      LIMIT 100;
    `);

    return NextResponse.json({
      success: true,
      ledgers: ledgersRes.rows,
      vouchers: vouchersRes.rows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_ledger') {
      const { code, name, group_type, balance_type = 'DR', opening_balance = 0 } = body;
      const res = await client.query(`
        INSERT INTO ledgers (code, name, group_type, balance_type, opening_balance, current_balance, is_system)
        VALUES ($1, $2, $3, $4, $5, $5, FALSE) RETURNING *;
      `, [code, name, group_type, balance_type, opening_balance]);
      return NextResponse.json({ success: true, ledger: res.rows[0] });
    }

    if (action === 'post_voucher') {
      const {
        voucher_type, // 'PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL'
        voucher_date = new Date().toISOString().split('T')[0],
        reference_no,
        narration,
        created_by = 1,
        items // [{ ledger_id, debit, credit, narration }]
      } = body;

      // Check debits equal credits
      const totalDebit = items.reduce((s: number, i: any) => s + (Number(i.debit) || 0), 0);
      const totalCredit = items.reduce((s: number, i: any) => s + (Number(i.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.05) {
        return NextResponse.json({ success: false, error: `Double-entry mismatch! Debits: ₹${totalDebit} != Credits: ₹${totalCredit}` }, { status: 400 });
      }

      await client.query('BEGIN');

      const countRes = await client.query(`SELECT COUNT(*) FROM journal_vouchers WHERE voucher_type = $1`, [voucher_type]);
      const nextNum = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(4, '0');
      const voucher_no = body.voucher_no || `${voucher_type.substring(0, 3)}/26-27/${nextNum}`;

      const vRes = await client.query(`
        INSERT INTO journal_vouchers (voucher_no, voucher_type, voucher_date, reference_no, narration, created_by)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `, [voucher_no, voucher_type, voucher_date, reference_no || '', narration || '', created_by]);

      const vId = vRes.rows[0].id;

      for (const itm of items) {
        await client.query(`
          INSERT INTO journal_items (voucher_id, ledger_id, debit, credit, narration)
          VALUES ($1, $2, $3, $4, $5);
        `, [vId, itm.ledger_id, itm.debit || 0, itm.credit || 0, itm.narration || '']);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, voucher: vRes.rows[0] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
