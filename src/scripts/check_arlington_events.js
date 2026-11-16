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

async function checkArlington() {
  const userEventsResult = await pool.query('SELECT * FROM get_all_events()');
  const userEvents = userEventsResult.rows || [];

  const partnerResult = await pool.query('SELECT id, original_title, location_name, event_date FROM public."Partner_Events" ORDER BY id ASC');
  const partnerEvents = partnerResult.rows || [];

  console.log("=== PLATFORM EVENTS IN VA / ARLINGTON ===");
  userEvents.forEach(e => {
    const loc = (e.Venue || e.location || e.location_name || e.Name || "").toLowerCase();
    if (loc.includes('arlington') || loc.includes('va') || loc.includes('virginia')) {
      console.log(`[Platform #${e.Id}] ${e.Name} -> Venue: ${e.Venue}`);
    }
  });

  console.log("\n=== PARTNER EVENTS IN VA / ARLINGTON ===");
  partnerEvents.forEach(e => {
    const loc = (e.location_name || e.original_title || "").toLowerCase();
    if (loc.includes('arlington') || loc.includes('va') || loc.includes('virginia')) {
      console.log(`[Partner #${e.id}] ${e.original_title} -> Location: ${e.location_name}`);
    }
  });

  await pool.end();
}

checkArlington().catch(err => console.error(err));
