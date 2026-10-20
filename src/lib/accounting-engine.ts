import pool from './db';

export interface TrialBalanceItem {
  id: number;
  code: string;
  name: string;
  group_type: string;
  debit: number;
  credit: number;
}

export interface BalanceSheetData {
  asOnDate: string;
  liabilities: {
    capitalAndReserves: { name: string; amount: number }[];
    longTermLiabilities: { name: string; amount: number }[];
    currentLiabilities: { name: string; amount: number }[];
    totalLiabilities: number;
  };
  assets: {
    fixedAssets: { name: string; amount: number }[];
    currentAssets: { name: string; amount: number }[];
    totalAssets: number;
  };
  isBalanced: boolean;
  difference: number;
}

export interface ProfitLossData {
  period: string;
  tradingAccount: {
    sales: number;
    closingStock: number;
    purchases: number;
    directExpenses: number;
    grossProfit: number;
  };
  incomeStatement: {
    grossProfit: number;
    indirectIncomes: number;
    indirectExpenses: number;
    netProfit: number;
  };
}

export async function getTrialBalance(): Promise<{ items: TrialBalanceItem[]; totalDebit: number; totalCredit: number }> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        l.id,
        l.code,
        l.name,
        l.group_type,
        l.balance_type,
        l.opening_balance,
        COALESCE(SUM(ji.debit), 0) AS total_voucher_debit,
        COALESCE(SUM(ji.credit), 0) AS total_voucher_credit
      FROM ledgers l
      LEFT JOIN journal_items ji ON l.id = ji.ledger_id
      GROUP BY l.id, l.code, l.name, l.group_type, l.balance_type, l.opening_balance
      ORDER BY l.code;
    `);

    let totalDebit = 0;
    let totalCredit = 0;

    const items: TrialBalanceItem[] = res.rows.map(row => {
      const openBal = Number(row.opening_balance);
      const vDebit = Number(row.total_voucher_debit);
      const vCredit = Number(row.total_voucher_credit);

      let netDebit = 0;
      let netCredit = 0;

      if (row.balance_type === 'DR') {
        const net = openBal + vDebit - vCredit;
        if (net >= 0) {
          netDebit = net;
        } else {
          netCredit = Math.abs(net);
        }
      } else {
        const net = openBal + vCredit - vDebit;
        if (net >= 0) {
          netCredit = net;
        } else {
          netDebit = Math.abs(net);
        }
      }

      totalDebit += netDebit;
      totalCredit += netCredit;

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        group_type: row.group_type,
        debit: parseFloat(netDebit.toFixed(2)),
        credit: parseFloat(netCredit.toFixed(2))
      };
    });

    return {
      items,
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2))
    };
  } finally {
    client.release();
  }
}

export async function getProfitAndLoss(): Promise<ProfitLossData> {
  const client = await pool.connect();
  try {
    // 1. Sales revenue from invoices or sales ledgers
    const salesRes = await client.query(`
      SELECT COALESCE(SUM(taxable_value), 0) as total_sales FROM invoices WHERE direction = 'OUTWARD' AND status != 'CANCELLED';
    `);
    const totalSales = Number(salesRes.rows[0].total_sales);

    // 2. Purchases from invoices or purchase ledgers
    const purRes = await client.query(`
      SELECT COALESCE(SUM(taxable_value), 0) as total_purchases FROM invoices WHERE direction = 'INWARD' AND status != 'CANCELLED';
    `);
    const totalPurchases = Number(purRes.rows[0].total_purchases);

    // 3. Stock valuation
    const stockRes = await client.query(`
      SELECT COALESCE(SUM(current_stock_primary * cost_price), 0) as closing_stock FROM stock_items;
    `);
    const closingStock = Number(stockRes.rows[0].closing_stock);

    // 4. Payroll Expenses
    const payRes = await client.query(`
      SELECT COALESCE(SUM(gross_earned + epf_employer + esi_employer), 0) as total_payroll_exp FROM payroll_records;
    `);
    const payrollExpense = Number(payRes.rows[0].total_payroll_exp);

    // 5. Additional indirect expenses from TDS bookings (Rent, Professional fees, Contractor)
    const tdsExpRes = await client.query(`
      SELECT COALESCE(SUM(booking_amount), 0) as other_exp FROM tds_tcs_entries WHERE nature_type = 'TDS' AND old_section != '194Q';
    `);
    const otherExpenses = Number(tdsExpRes.rows[0].other_exp);

    const directExpenses = 25000; // Power, fuel & freight baseline
    const grossProfit = totalSales - totalPurchases - directExpenses;

    const indirectExpenses = payrollExpense + otherExpenses + 15000; // depreciation/office
    const indirectIncomes = 8500; // Interest & scrap
    const netProfit = grossProfit + indirectIncomes - indirectExpenses;

    return {
      period: 'Financial Year 2026-27 (Up to Current Date)',
      tradingAccount: {
        sales: parseFloat(totalSales.toFixed(2)),
        closingStock: parseFloat(closingStock.toFixed(2)),
        purchases: parseFloat(totalPurchases.toFixed(2)),
        directExpenses: parseFloat(directExpenses.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2))
      },
      incomeStatement: {
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        indirectIncomes: parseFloat(indirectIncomes.toFixed(2)),
        indirectExpenses: parseFloat(indirectExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2))
      }
    };
  } finally {
    client.release();
  }
}

export async function getBalanceSheet(): Promise<BalanceSheetData> {
  const tb = await getTrialBalance();
  const pl = await getProfitAndLoss();

  const capitalAndReserves: { name: string; amount: number }[] = [];
  const longTermLiabilities: { name: string; amount: number }[] = [];
  const currentLiabilities: { name: string; amount: number }[] = [];
  const fixedAssets: { name: string; amount: number }[] = [];
  const currentAssets: { name: string; amount: number }[] = [];

  for (const item of tb.items) {
    if (item.group_type === 'Capital / Equity') {
      capitalAndReserves.push({ name: item.name, amount: item.credit || item.debit });
    } else if (item.group_type === 'Long-term Liabilities') {
      longTermLiabilities.push({ name: item.name, amount: item.credit });
    } else if (item.group_type === 'Current Liabilities') {
      currentLiabilities.push({ name: item.name, amount: item.credit || item.debit });
    } else if (item.group_type === 'Fixed Assets') {
      fixedAssets.push({ name: item.name, amount: item.debit });
    } else if (item.group_type === 'Current Assets') {
      currentAssets.push({ name: item.name, amount: item.debit || item.credit });
    }
  }

  // Include Net Profit in Capital & Reserves
  capitalAndReserves.push({
    name: 'Current Period Net Profit (P&L)',
    amount: pl.incomeStatement.netProfit
  });

  const totalCap = capitalAndReserves.reduce((s, x) => s + x.amount, 0);
  const totalLong = longTermLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalCurrLiab = currentLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalLiabilities = totalCap + totalLong + totalCurrLiab;

  const totalFixed = fixedAssets.reduce((s, x) => s + x.amount, 0);
  const totalCurrAssets = currentAssets.reduce((s, x) => s + x.amount, 0);
  const totalAssets = totalFixed + totalCurrAssets;

  const diff = Math.abs(totalAssets - totalLiabilities);

  return {
    asOnDate: new Date().toISOString().split('T')[0],
    liabilities: {
      capitalAndReserves,
      longTermLiabilities,
      currentLiabilities,
      totalLiabilities: parseFloat(totalLiabilities.toFixed(2))
    },
    assets: {
      fixedAssets,
      currentAssets,
      totalAssets: parseFloat(totalAssets.toFixed(2))
    },
    isBalanced: diff < 1.0,
    difference: parseFloat(diff.toFixed(2))
  };
}
