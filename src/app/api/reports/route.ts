import { NextResponse } from 'next/server';
import { getBalanceSheet, getProfitAndLoss, getTrialBalance } from '@/lib/accounting-engine';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'balance_sheet', 'profit_loss', 'trial_balance', 'daybook', 'all'

    if (type === 'balance_sheet') {
      const bs = await getBalanceSheet();
      return NextResponse.json({ success: true, balanceSheet: bs });
    }

    if (type === 'profit_loss') {
      const pl = await getProfitAndLoss();
      return NextResponse.json({ success: true, profitLoss: pl });
    }

    if (type === 'trial_balance') {
      const tb = await getTrialBalance();
      return NextResponse.json({ success: true, trialBalance: tb });
    }

    if (type === 'daybook') {
      const dbRes = await pool.query(`
        SELECT 
          v.id,
          v.voucher_no,
          v.voucher_type,
          v.voucher_date,
          v.reference_no,
          v.narration,
          u.full_name as created_by_name,
          json_agg(
            json_build_object(
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
        ORDER BY v.voucher_date DESC, v.id DESC;
      `);
      return NextResponse.json({ success: true, daybook: dbRes.rows });
    }

    // Default 'all' reports bundle
    const [bs, pl, tb] = await Promise.all([
      getBalanceSheet(),
      getProfitAndLoss(),
      getTrialBalance()
    ]);

    return NextResponse.json({
      success: true,
      balanceSheet: bs,
      profitLoss: pl,
      trialBalance: tb
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
