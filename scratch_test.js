const { Pool } = require('pg');

const pool = new Pool({
  user: 'clark',
  host: '199.244.49.83',
  database: 'swingsocialdb',
  password: 'Jaguar2020#',
  port: 5432,
});

async function test() {
  try {
    console.log("Connecting...");
    const res = await pool.query(`
      SELECT up."Id", up."Username", COUNT(ep."EventsId") as rsvp_count
      FROM "UserProfiles" up
      LEFT JOIN "EventUserProfile" ep ON ep."AttendeesId" = up."Id"
      WHERE up."Username" ILIKE 'chrisnleslie'
      GROUP BY up."Id", up."Username"
    `);
    console.log("chrisnleslie query result:");
    console.log(res.rows);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await pool.end();
  }
}

test();
