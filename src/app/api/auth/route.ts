import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const usersRes = await pool.query(`
      SELECT id, username, full_name, email, role, department, permissions, is_active, created_at 
      FROM erp_users 
      ORDER BY id;
    `);

    const compRes = await pool.query(`
      SELECT * FROM company_profile LIMIT 1;
    `);

    let activeUser = usersRes.rows[0];
    if (userId) {
      const match = usersRes.rows.find(u => u.id === parseInt(userId, 10));
      if (match) activeUser = match;
    }

    return NextResponse.json({
      success: true,
      activeUser,
      allUsers: usersRes.rows,
      company: compRes.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
