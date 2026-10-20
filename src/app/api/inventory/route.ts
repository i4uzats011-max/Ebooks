import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT 
        s.*,
        ROUND((s.current_stock_primary * s.cost_price)::numeric, 2) AS stock_value
      FROM stock_items s
      ORDER BY s.id;
    `);

    // Also get recent stock movements (Item-wise ledger)
    const movRes = await pool.query(`
      SELECT 
        ii.item_id,
        si.name as item_name,
        inv.invoice_no,
        inv.invoice_date,
        inv.direction,
        inv.party_name,
        ii.primary_qty,
        ii.primary_unit,
        ii.secondary_qty,
        ii.secondary_unit,
        ii.unit_rate,
        ii.taxable_amount
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN stock_items si ON ii.item_id = si.id
      WHERE inv.status != 'CANCELLED'
      ORDER BY inv.invoice_date DESC, inv.id DESC
      LIMIT 100;
    `);

    return NextResponse.json({
      success: true,
      items: res.rows,
      stockMovements: movRes.rows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_item') {
      const {
        sku,
        name,
        description,
        category,
        hsn_code,
        primary_unit,
        secondary_unit,
        unit_relation_type,
        conversion_factor,
        opening_stock_primary,
        opening_stock_secondary,
        cost_price,
        selling_price,
        gst_rate,
        cess_rate,
        min_reorder_level
      } = body;

      const res = await pool.query(`
        INSERT INTO stock_items (
          sku, name, description, category, hsn_code,
          primary_unit, secondary_unit, unit_relation_type, conversion_factor,
          opening_stock_primary, opening_stock_secondary,
          current_stock_primary, current_stock_secondary,
          cost_price, selling_price, gst_rate, cess_rate, min_reorder_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *;
      `, [
        sku,
        name,
        description || '',
        category || 'General',
        hsn_code,
        primary_unit,
        secondary_unit || null,
        unit_relation_type || 'FIXED_COMPOUND',
        conversion_factor || 1,
        opening_stock_primary || 0,
        opening_stock_secondary || 0,
        cost_price || 0,
        selling_price || 0,
        gst_rate || 18,
        cess_rate || 0,
        min_reorder_level || 10
      ]);

      return NextResponse.json({ success: true, item: res.rows[0] });
    }

    if (action === 'adjust_stock') {
      const { itemId, adjustmentPrimary, adjustmentSecondary, reason } = body;
      const res = await pool.query(`
        UPDATE stock_items 
        SET current_stock_primary = current_stock_primary + $1,
            current_stock_secondary = COALESCE(current_stock_secondary, 0) + $2
        WHERE id = $3
        RETURNING *;
      `, [adjustmentPrimary, adjustmentSecondary || 0, itemId]);

      return NextResponse.json({ success: true, item: res.rows[0], message: `Stock adjusted: ${reason}` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
