import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, username, full_name, email, role, department, permissions, is_active, created_at 
      FROM erp_users 
      ORDER BY id;
    `);
    return NextResponse.json({ success: true, users: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, permissions, username, full_name, email, role, department, password } = body;

    if (action === 'update_permissions') {
      await pool.query(
        `UPDATE erp_users SET permissions = $1::jsonb WHERE id = $2;`,
        [JSON.stringify(permissions || []), userId]
      );
      return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
    }

    if (action === 'create_user') {
      const res = await pool.query(
        `INSERT INTO erp_users (username, password_hash, full_name, email, role, department, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING id, username, full_name, email, role;`,
        [username, password || 'pass123', full_name, email, role, department, JSON.stringify(permissions || [])]
      );
      return NextResponse.json({ success: true, user: res.rows[0] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
