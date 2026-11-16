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

// LOCATION_COORDINATES dictionary from src/utils/distance.ts
const LOCATION_COORDINATES = {
  miami: { lat: 25.7617, lon: -80.1918 },
  "fort lauderdale": { lat: 26.1224, lon: -80.1373 },
  orlando: { lat: 28.5383, lon: -81.3792 },
  tampa: { lat: 27.9506, lon: -82.4572 },
  jacksonville: { lat: 30.3322, lon: -81.6557 },
  "las vegas": { lat: 36.1699, lon: -115.1398 },
  reno: { lat: 39.5296, lon: -119.8138 },
  "los angeles": { lat: 34.0522, lon: -118.2437 },
  "san diego": { lat: 32.7157, lon: -117.1611 },
  "san francisco": { lat: 37.7749, lon: -122.4194 },
  "new york": { lat: 40.7128, lon: -74.006 },
  nyc: { lat: 40.7128, lon: -74.006 },
  chicago: { lat: 41.8781, lon: -87.6298 },
  houston: { lat: 29.7604, lon: -95.3698 },
  dallas: { lat: 32.7767, lon: -96.797 },
  austin: { lat: 30.2672, lon: -97.7431 },
  atlanta: { lat: 33.749, lon: -84.388 },
  phoenix: { lat: 33.4484, lon: -112.074 },
  denver: { lat: 39.7392, lon: -104.9903 },
  seattle: { lat: 47.6062, lon: -122.3321 },
  arlington: { lat: 38.87996, lon: -77.10677 },
  alexandria: { lat: 38.8048, lon: -77.0469 },
  fairfax: { lat: 38.8462, lon: -77.3064 },
  richmond: { lat: 37.5407, lon: -77.4360 },
  "washington dc": { lat: 38.9072, lon: -77.0369 },
  washington: { lat: 38.9072, lon: -77.0369 },
  dc: { lat: 38.9072, lon: -77.0369 },
  philadelphia: { lat: 39.9526, lon: -75.1652 },
  detroit: { lat: 42.3314, lon: -83.0458 },
  "san antonio": { lat: 29.4241, lon: -98.4936 },
  baltimore: { lat: 39.2904, lon: -76.6122 },
  columbia: { lat: 39.2037, lon: -76.8610 },
  dumfries: { lat: 38.5684, lon: -77.3280 },
  hyattsville: { lat: 38.9559, lon: -76.9455 },
  greenbelt: { lat: 39.0045, lon: -76.8755 },
  "upper marlboro": { lat: 38.8159, lon: -76.7497 },
  rockville: { lat: 39.0840, lon: -77.1528 },
  lanham: { lat: 38.9676, lon: -76.8622 },
  herndon: { lat: 38.9696, lon: -77.3861 },
  "harpers ferry": { lat: 39.3254, lon: -77.7389 },
  bensville: { lat: 38.6548, lon: -76.9747 },
  "sterling heights": { lat: 42.5803, lon: -83.0302 },
  cleveland: { lat: 41.4993, lon: -81.6944 },
  fl: { lat: 27.994402, lon: -81.760254 },
  florida: { lat: 27.994402, lon: -81.760254 },
  nv: { lat: 38.80261, lon: -116.419389 },
  nevada: { lat: 38.80261, lon: -116.419389 },
  ca: { lat: 36.778261, lon: -119.417932 },
  california: { lat: 36.778261, lon: -119.417932 },
  ny: { lat: 40.7128, lon: -74.006 },
  il: { lat: 40.633125, lon: -89.398528 },
  illinois: { lat: 40.633125, lon: -89.398528 },
  tx: { lat: 31.968599, lon: -99.901813 },
  texas: { lat: 31.968599, lon: -99.901813 },
  ga: { lat: 32.165622, lon: -82.900075 },
  az: { lat: 34.048928, lon: -111.093731 },
  co: { lat: 39.550051, lon: -105.782067 },
  wa: { lat: 47.751074, lon: -120.740135 },
  va: { lat: 37.431573, lon: -78.656894 },
  virginia: { lat: 37.431573, lon: -78.656894 },
  pa: { lat: 40.590752, lon: -77.209755 },
  pennsylvania: { lat: 40.590752, lon: -77.209755 },
  mi: { lat: 44.314844, lon: -85.602364 },
  michigan: { lat: 44.314844, lon: -85.602364 },
  md: { lat: 39.045755, lon: -76.641271 },
  maryland: { lat: 39.045755, lon: -76.641271 },
  ohio: { lat: 40.417287, lon: -82.907123 },
  oh: { lat: 40.417287, lon: -82.907123 },
  al: { lat: 32.318231, lon: -86.902298 },
  alabama: { lat: 32.318231, lon: -86.902298 },
  ak: { lat: 63.588753, lon: -154.493062 },
  alaska: { lat: 63.588753, lon: -154.493062 },
  ar: { lat: 35.20105, lon: -91.831833 },
  arkansas: { lat: 35.20105, lon: -91.831833 },
  ct: { lat: 41.603221, lon: -73.087749 },
  connecticut: { lat: 41.603221, lon: -73.087749 },
  de: { lat: 38.910832, lon: -75.52767 },
  delaware: { lat: 38.910832, lon: -75.52767 },
  hi: { lat: 19.898682, lon: -155.665857 },
  hawaii: { lat: 19.898682, lon: -155.665857 },
  id: { lat: 44.068203, lon: -114.742041 },
  idaho: { lat: 44.068203, lon: -114.742041 },
  in: { lat: 40.551217, lon: -85.602364 },
  indiana: { lat: 40.551217, lon: -85.602364 },
  ia: { lat: 41.878003, lon: -93.097702 },
  iowa: { lat: 41.878003, lon: -93.097702 },
  ks: { lat: 39.011902, lon: -98.484246 },
  kansas: { lat: 39.011902, lon: -98.484246 },
  ky: { lat: 37.839333, lon: -84.270018 },
  kentucky: { lat: 37.839333, lon: -84.270018 },
  la: { lat: 30.984297, lon: -91.962333 },
  louisiana: { lat: 30.984297, lon: -91.962333 },
  me: { lat: 45.253783, lon: -69.445469 },
  maine: { lat: 45.253783, lon: -69.445469 },
  ma: { lat: 42.407211, lon: -71.382437 },
  massachusetts: { lat: 42.407211, lon: -71.382437 },
  mn: { lat: 46.729553, lon: -94.6859 },
  minnesota: { lat: 46.729553, lon: -94.6859 },
  ms: { lat: 32.354668, lon: -89.398528 },
  mississippi: { lat: 32.354668, lon: -89.398528 },
  mo: { lat: 37.964253, lon: -91.831833 },
  missouri: { lat: 37.964253, lon: -91.831833 },
  mt: { lat: 46.879682, lon: -110.362566 },
  montana: { lat: 46.879682, lon: -110.362566 },
  ne: { lat: 41.492537, lon: -99.901813 },
  nebraska: { lat: 41.492537, lon: -99.901813 },
  nh: { lat: 43.193852, lon: -71.572395 },
  "new hampshire": { lat: 43.193852, lon: -71.572395 },
  nj: { lat: 40.058324, lon: -74.405661 },
  "new jersey": { lat: 40.058324, lon: -74.405661 },
  nm: { lat: 34.51994, lon: -105.87009 },
  "new mexico": { lat: 34.51994, lon: -105.87009 },
  nc: { lat: 35.759573, lon: -79.0193 },
  "north carolina": { lat: 35.759573, lon: -79.0193 },
  nd: { lat: 47.551493, lon: -101.002012 },
  "north dakota": { lat: 47.551493, lon: -101.002012 },
  ok: { lat: 35.007752, lon: -97.092877 },
  oklahoma: { lat: 35.007752, lon: -97.092877 },
  or: { lat: 43.804133, lon: -120.554201 },
  oregon: { lat: 43.804133, lon: -120.554201 },
  ri: { lat: 41.580095, lon: -71.477429 },
  "rhode island": { lat: 41.580095, lon: -71.477429 },
  sc: { lat: 33.836081, lon: -81.163725 },
  "south carolina": { lat: 33.836081, lon: -81.163725 },
  sd: { lat: 43.969515, lon: -99.901813 },
  "south dakota": { lat: 43.969515, lon: -99.901813 },
  tn: { lat: 35.517491, lon: -86.580447 },
  tennessee: { lat: 35.517491, lon: -86.580447 },
  ut: { lat: 39.32098, lon: -111.093731 },
  utah: { lat: 39.32098, lon: -111.093731 },
  vt: { lat: 44.558803, lon: -72.577841 },
  vermont: { lat: 44.558803, lon: -72.577841 },
  wv: { lat: 38.597626, lon: -80.454903 },
  "west virginia": { lat: 38.597626, lon: -80.454903 },
  wi: { lat: 43.784439, lon: -88.787868 },
  wisconsin: { lat: 43.784439, lon: -88.787868 },
  wy: { lat: 43.075968, lon: -107.290284 },
  wyoming: { lat: 43.075968, lon: -107.290284 }
};

function getEventCoords(e) {
  const lat = parseFloat(e.Latitude || e.latitude || e.VenueLatitude || e.AddressLatitude);
  const lon = parseFloat(e.Longitude || e.longitude || e.VenueLongitude || e.AddressLongitude);
  if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
    return { lat, lon };
  }
  const loc = (e.Venue || e.location || e.location_name || e.Name || "").toLowerCase();
  if (!loc) return null;
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (key.length <= 2) {
      const regex = new RegExp(`\\b${key}\\b`, "i");
      if (regex.test(loc)) {
        return coords;
      }
    } else {
      if (loc.includes(key)) {
        return coords;
      }
    }
  }
  return null;
}

async function analyze() {
  const userEventsResult = await pool.query('SELECT * FROM get_all_events()');
  const userEvents = userEventsResult.rows || [];

  const partnerResult = await pool.query('SELECT id, original_title, location_name, event_date FROM public."Partner_Events" ORDER BY id ASC');
  const partnerEvents = partnerResult.rows || [];

  const missingPlatform = [];
  const missingPartner = [];

  for (const e of userEvents) {
    const coords = getEventCoords(e);
    if (!coords) {
      missingPlatform.push({
        ID: e.Id || e.id,
        EventName: e.Name || e.title || "Untitled",
        VenueLocation: e.Venue || e.location || "Missing Location Text"
      });
    }
  }

  for (const e of partnerEvents) {
    const coords = getEventCoords({ Venue: e.location_name, Name: e.original_title });
    if (!coords) {
      missingPartner.push({
        ID: e.id,
        EventName: e.original_title || "Untitled",
        VenueLocation: e.location_name || "Missing Location Text"
      });
    }
  }

  console.log("JSON_OUTPUT_START");
  console.log(JSON.stringify({ missingPlatform, missingPartner }, null, 2));
  console.log("JSON_OUTPUT_END");

  await pool.end();
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
