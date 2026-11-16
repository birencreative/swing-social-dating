const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let envConfig = {};
try {
  const envFile = fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const k = parts[0].trim();
      const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      envConfig[k] = v;
    }
  });
} catch (e) {}

const pool = new Pool({
  user: envConfig.DB_USER || process.env.DB_USER,
  host: envConfig.DB_HOST || process.env.DB_HOST,
  database: envConfig.DB_NAME || process.env.DB_NAME,
  password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD,
  port: Number(envConfig.DB_PORT || process.env.DB_PORT || 5432),
  ssl: { rejectUnauthorized: false }
});

async function testCitySearch() {
  const term = "Las Vegas";
  const searchPattern = `%${term}%`;

  const query = `
    SELECT "City" || ', ' || "State" AS "StateFull", "State"
    FROM "UsCities"
    WHERE "City" ILIKE $1
       OR "State" ILIKE $1
       OR ("City" || ', ' || "State") ILIKE $1
    UNION
    SELECT "StateFull", "State"
    FROM "UsStates"
    WHERE "StateFull" ILIKE $1
       OR "State" ILIKE $1
    ORDER BY "StateFull"
    LIMIT 20
  `;

  const res = await pool.query(query, [searchPattern]);
  console.log("Results for 'Las Vegas':", res.rows);

  const term2 = "Arlington";
  const res2 = await pool.query(query, [`%${term2}%`]);
  console.log("\nResults for 'Arlington':", res2.rows);

  const term3 = "Virginia";
  const res3 = await pool.query(query, [`%${term3}%`]);
  console.log("\nResults for 'Virginia':", res3.rows.slice(0, 10));

  await pool.end();
}

testCitySearch().catch(err => {
  console.error(err);
  process.exit(1);
});
