const { Pool } = require('pg');

const pool = new Pool({
  user: 'clark',
  host: '199.244.49.83',
  database: 'swingsocialdb',
  password: 'Jaguar2020#',
  port: 5432,
});

async function main() {
  try {
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notification_preferences';
    `);
    console.log("notification_preferences columns:");
    tableInfo.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    const samples = await pool.query(`
      SELECT * FROM notification_preferences LIMIT 5;
    `);
    console.log("\nSamples:");
    console.log(samples.rows);

  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await pool.end();
  }
}

main();
