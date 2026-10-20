import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'db.fkwtqizwjuxabjuixcew.supabase.co',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '#1234@ff###hH',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

async function testConnection() {
  console.log('Testing PostgreSQL connection to Supabase...');
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time, version() as version;');
    console.log('SUCCESS! Connected to PostgreSQL:');
    console.log('Time:', res.rows[0].current_time);
    console.log('Version:', res.rows[0].version);
    client.release();
    process.exit(0);
  } catch (err: any) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
