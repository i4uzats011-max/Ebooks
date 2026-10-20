import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

async function ensureColumns() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_attachments (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(30) NOT NULL,
      entity_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_size INT,
      file_data TEXT,
      uploaded_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE document_attachments ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
    ALTER TABLE document_attachments ADD COLUMN IF NOT EXISTS cloud_provider VARCHAR(40) DEFAULT 'LOCAL_SECURE';
    ALTER TABLE document_attachments ADD COLUMN IF NOT EXISTS cloud_file_id VARCHAR(150);
    ALTER TABLE document_attachments ADD COLUMN IF NOT EXISTS share_url TEXT;
    ALTER TABLE document_attachments ADD COLUMN IF NOT EXISTS is_public_share BOOLEAN DEFAULT TRUE;
  `);
}

export async function GET(request: Request) {
  try {
    await ensureColumns();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'INVOICE', 'ITEM', 'VOUCHER', 'EMPLOYEE'
    const entityId = searchParams.get('entityId');
    const shareToken = searchParams.get('token');

    if (shareToken) {
      const single = await pool.query(`SELECT * FROM document_attachments WHERE share_token = $1`, [shareToken]);
      if (single.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Document not found or link expired' }, { status: 404 });
      }
      return NextResponse.json({ success: true, document: single.rows[0] });
    }

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
    await ensureColumns();
    const body = await request.json();
    const {
      entity_type,
      entity_id,
      file_name,
      file_type,
      file_size,
      file_data,
      uploaded_by,
      cloud_provider = 'GOOGLE_DRIVE',
      cloud_file_id
    } = body;

    const shareToken = crypto.randomBytes(12).toString('hex');
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const shareUrl = `${protocol}://${host}/share/${shareToken}`;

    const res = await pool.query(`
      INSERT INTO document_attachments (
        entity_type, entity_id, file_name, file_type, file_size, file_data, uploaded_by,
        share_token, cloud_provider, cloud_file_id, share_url, is_public_share
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
      RETURNING *;
    `, [
      entity_type,
      entity_id,
      file_name,
      file_type || 'application/octet-stream',
      file_size || 0,
      file_data,
      uploaded_by || 'Current User',
      shareToken,
      cloud_provider,
      cloud_file_id || `GD-${shareToken}`,
      shareUrl
    ]);

    return NextResponse.json({
      success: true,
      document: res.rows[0],
      shareUrl: res.rows[0].share_url,
      message: `Document saved to ${cloud_provider.replace('_', ' ')} and shareable link created!`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
