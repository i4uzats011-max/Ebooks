import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'INVOICE', 'ITEM', 'VOUCHER', 'EMPLOYEE'
    const entityId = searchParams.get('entityId');

    let queryText = 'SELECT * FROM document_attachments';
    const params: any[] = [];

    if (entityType && entityId) {
      queryText += ' WHERE entity_type = $1 AND entity_id = $2';
      params.push(entityType, parseInt(entityId, 10));
    } else if (entityType) {
      queryText += ' WHERE entity_type = $1';
      params.push(entityType);
    }

    queryText += ' ORDER BY id DESC';

    const res = await pool.query(queryText, params);
    return NextResponse.json({ success: true, documents: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entity_type, entity_id, file_name, file_type, file_size, file_data, uploaded_by } = body;

    const res = await pool.query(`
      INSERT INTO document_attachments (
        entity_type, entity_id, file_name, file_type, file_size, file_data, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `, [
      entity_type,
      entity_id,
      file_name,
      file_type || 'application/octet-stream',
      file_size || 0,
      file_data,
      uploaded_by || 'User'
    ]);

    return NextResponse.json({ success: true, document: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
