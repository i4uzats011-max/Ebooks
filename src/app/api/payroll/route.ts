import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { calculateIndianPayroll } from '@/lib/payroll-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-10';

    const empRes = await pool.query(`
      SELECT * FROM employees WHERE is_active = TRUE ORDER BY emp_code;
    `);

    const payRes = await pool.query(`
      SELECT 
        pr.*,
        e.full_name as employee_name,
        e.emp_code,
        e.designation,
        e.department,
        e.pan,
        e.uan,
        e.esic_number,
        e.bank_name,
        e.bank_account_no,
        e.bank_ifsc
      FROM payroll_records pr
      JOIN employees e ON pr.employee_id = e.id
      WHERE pr.month = $1
      ORDER BY e.emp_code;
    `, [month]);

    const compRes = await pool.query('SELECT * FROM company_profile LIMIT 1');

    return NextResponse.json({
      success: true,
      month,
      company: compRes.rows[0],
      employees: empRes.rows,
      payrollRecords: payRes.rows
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

    if (action === 'create_employee') {
      const {
        emp_code,
        full_name,
        designation,
        department,
        date_of_joining = new Date().toISOString().split('T')[0],
        pan,
        uan,
        pf_number,
        esic_number,
        bank_name,
        bank_account_no,
        bank_ifsc,
        basic_salary,
        hra,
        special_allowance,
        is_pf_eligible = true,
        is_esi_eligible = true,
        is_pt_eligible = true
      } = body;

      const gross_salary = Number(basic_salary) + Number(hra) + Number(special_allowance);

      const res = await client.query(`
        INSERT INTO employees (
          emp_code, full_name, designation, department, date_of_joining,
          pan, uan, pf_number, esic_number, bank_name, bank_account_no, bank_ifsc,
          basic_salary, hra, special_allowance, gross_salary,
          is_pf_eligible, is_esi_eligible, is_pt_eligible, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE
        ) RETURNING *;
      `, [
        emp_code, full_name, designation, department, date_of_joining,
        pan, uan || null, pf_number || null, esic_number || null,
        bank_name || null, bank_account_no || null, bank_ifsc || null,
        basic_salary, hra, special_allowance, gross_salary,
        is_pf_eligible, is_esi_eligible, is_pt_eligible
      ]);

      return NextResponse.json({ success: true, employee: res.rows[0] });
    }

    if (action === 'run_payroll') {
      const { month = '2026-10', employee_ids } = body;

      await client.query('BEGIN');

      const empRes = await client.query(`SELECT * FROM employees WHERE is_active = TRUE;`);
      const employees = empRes.rows.filter(e => !employee_ids || employee_ids.includes(e.id));

      const generatedRecords: any[] = [];

      for (const emp of employees) {
        // Calculate EPF, ESI, PT, and Net
        const calc = calculateIndianPayroll({
          basicSalary: Number(emp.basic_salary),
          hra: Number(emp.hra),
          specialAllowance: Number(emp.special_allowance),
          workingDays: 30,
          presentDays: 30,
          isPfEligible: emp.is_pf_eligible,
          isEsiEligible: emp.is_esi_eligible,
          isPtEligible: emp.is_pt_eligible,
          tdsDeduction: Number(emp.gross_salary) > 40000 ? 1500 : 0
        });

        // Upsert record for this month
        await client.query(`DELETE FROM payroll_records WHERE employee_id = $1 AND month = $2;`, [emp.id, month]);

        const insRes = await client.query(`
          INSERT INTO payroll_records (
            month, employee_id, working_days, present_days,
            basic_earned, hra_earned, special_allowance_earned, gross_earned,
            epf_employee, epf_employer, esi_employee, esi_employer, professional_tax,
            tds_deducted, other_deductions, total_deductions, net_payable,
            payment_status, payment_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'PAID', CURRENT_DATE
          ) RETURNING *;
        `, [
          month, emp.id, calc.workingDays, calc.presentDays,
          calc.basicEarned, calc.hraEarned, calc.specialAllowanceEarned, calc.grossEarned,
          calc.epfEmployee, calc.epfEmployer, calc.esiEmployee, calc.esiEmployer, calc.professionalTax,
          calc.tdsDeducted, 0, calc.totalDeductions, calc.netPayable
        ]);

        generatedRecords.push(insRes.rows[0]);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, count: generatedRecords.length, records: generatedRecords });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
