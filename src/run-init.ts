import { initializeDatabase } from './lib/init-db.ts';

async function main() {
  try {
    await initializeDatabase();
    console.log('Database initialization finished without error.');
    process.exit(0);
  } catch (err: any) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

main();
