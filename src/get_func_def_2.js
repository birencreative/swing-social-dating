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
    const fcmTokenFunc = await pool.query(`
      SELECT pg_get_functiondef(p.oid) AS func_def
      FROM pg_proc p
      WHERE p.proname = 'upsert_fcm_token';
    `);
    console.log("upsert_fcm_token FUNCTION DEF:");
    console.log(fcmTokenFunc.rows[0]?.func_def);

    const getDeviceTokenFunc = await pool.query(`
      SELECT pg_get_functiondef(p.oid) AS func_def
      FROM pg_proc p
      WHERE p.proname = 'web_get_devicetoken';
    `);
    console.log("\nweb_get_devicetoken FUNCTION DEF:");
    console.log(getDeviceTokenFunc.rows[0]?.func_def);

  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await pool.end();
  }
}

main();
