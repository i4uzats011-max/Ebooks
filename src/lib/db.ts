import { Pool } from 'pg';

// Global database pool for Next.js
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const pool =
  global.__dbPool ||
  new Pool({
    host: process.env.PGHOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: parseInt(process.env.PGPORT || '6543', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres.fkwtqizwjuxabjuixcew',
    password: process.env.PGPASSWORD || '#1234@ff###hH',
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbPool = pool;
}

export default pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('Database query error:', error.message, 'Query:', text.substring(0, 100));
    throw error;
  }
}
