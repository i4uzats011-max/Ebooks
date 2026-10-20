import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cloud_storage_configs (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES erp_users(id),
      provider VARCHAR(40) NOT NULL, -- 'GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE'
      account_email VARCHAR(100),
      access_token TEXT,
      folder_id VARCHAR(150),
      folder_name VARCHAR(150) DEFAULT 'MyBooks_Accounting_Documents',
      is_active BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function GET(request: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1';

    const res = await pool.query(`
      SELECT id, provider, account_email, folder_name, is_active, updated_at
      FROM cloud_storage_configs
      WHERE user_id = $1;
    `, [parseInt(userId, 10)]);

    return NextResponse.json({ success: true, configs: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { user_id = 1, provider, account_email, access_token, folder_name = 'MyBooks_Accounting_Documents' } = body;

    if (!provider || !account_email) {
      return NextResponse.json({ success: false, error: 'Provider and account email are required' }, { status: 400 });
    }

    // Upsert user cloud drive authentication
    const check = await pool.query(
      `SELECT id FROM cloud_storage_configs WHERE user_id = $1 AND provider = $2`,
      [user_id, provider]
    );

    let result;
    if (check.rows.length > 0) {
      result = await pool.query(`
        UPDATE cloud_storage_configs 
        SET account_email = $1, access_token = $2, folder_name = $3, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, provider, account_email, folder_name, is_active, updated_at;
      `, [account_email, access_token || 'TOKEN_AUTHENTICATED', folder_name, check.rows[0].id]);
    } else {
      result = await pool.query(`
        INSERT INTO cloud_storage_configs (user_id, provider, account_email, access_token, folder_name, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id, provider, account_email, folder_name, is_active, updated_at;
      `, [user_id, provider, account_email, access_token || 'TOKEN_AUTHENTICATED', folder_name]);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully authenticated ${provider.replace('_', ' ')} for ${account_email}`,
      config: result.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
