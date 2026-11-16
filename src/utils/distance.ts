/**
 * Utility functions for calculating geographical distances and retrieving coordinates
 * matching swing-social-expo implementation.
 */

// Coordinate Lookup for US Cities & States
export const LOCATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // --- Specific Cities (Must be listed BEFORE State abbreviations) ---
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
  philly: { lat: 39.9526, lon: -75.1652 },
  "philly ne": { lat: 40.0483, lon: -75.0308 },
  "on premise philly ne": { lat: 40.0483, lon: -75.0308 },
  "freedom hall": { lat: 40.0483, lon: -75.0308 },
  "club friction": { lat: 40.0483, lon: -75.0308 },
  friction: { lat: 40.0483, lon: -75.0308 },
  frankford: { lat: 40.015, lon: -75.074 },
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

  // --- International & Additional US Cities ---
  london: { lat: 51.5074, lon: -0.1278 },
  "city of london": { lat: 51.5074, lon: -0.1278 },
  "united kingdom": { lat: 51.5074, lon: -0.1278 },
  "le boudoir": { lat: 51.5074, lon: -0.1278 },
  trieste: { lat: 45.6495, lon: 13.7768 },
  italy: { lat: 45.6495, lon: 13.7768 },
  "winston salem": { lat: 36.0999, lon: -80.2442 },
  "winston-salem": { lat: 36.0999, lon: -80.2442 },
  nashville: { lat: 36.1627, lon: -86.7816 },
  chattanooga: { lat: 35.0456, lon: -85.3097 },
  birmingham: { lat: 33.5186, lon: -86.8104 },
  calgary: { lat: 51.0447, lon: -114.0719 },
  negril: { lat: 18.2782, lon: -78.3438 },
  jamaica: { lat: 18.2782, lon: -78.3438 },
  jaco: { lat: 9.6149, lon: -84.6297 },
  "costa rica": { lat: 9.6149, lon: -84.6297 },
  "san juan": { lat: 18.4655, lon: -66.1057 },
  "puerto rico": { lat: 18.4655, lon: -66.1057 },
  barcelona: { lat: 41.3851, lon: 2.1734 },
  spain: { lat: 41.3851, lon: 2.1734 },
  bangkok: { lat: 13.7563, lon: 100.5018 },
  thailand: { lat: 13.7563, lon: 100.5018 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  tanzania: { lat: -6.3690, lon: 34.8888 },
  lisbon: { lat: 38.7223, lon: -9.1393 },
  portugal: { lat: 38.7223, lon: -9.1393 },
  "puerto morelos": { lat: 20.8476, lon: -86.8756 },
  mexico: { lat: 23.6345, lon: -102.5528 },

  // --- Popular Lifestyle Venues & Club Mappings ---
  "eyes wide shut": { lat: 27.9506, lon: -82.4572 }, // Tampa, FL
  "eyz wide shut": { lat: 27.9506, lon: -82.4572 },
  "twist club": { lat: 25.7617, lon: -80.1918 }, // Miami, FL
  "at twist": { lat: 25.7617, lon: -80.1918 },
  twist: { lat: 25.7617, lon: -80.1918 },
  "club safe word": { lat: 34.0522, lon: -118.2437 }, // Los Angeles, CA
  "safe word": { lat: 34.0522, lon: -118.2437 },
  seanchalet: { lat: 25.7617, lon: -80.1918 }, // Miami, FL
  "birmingham private hotel": { lat: 33.5186, lon: -86.8104 }, // Birmingham, AL
  "chattanooga private hotel": { lat: 35.0456, lon: -85.3097 }, // Chattanooga, TN
  "red room nashville": { lat: 36.1627, lon: -86.7816 }, // Nashville, TN
  "camp office": { lat: 33.749, lon: -84.388 }, // Atlanta, GA
  "desire riviera maya": { lat: 20.8476, lon: -86.8756 }, // Puerto Morelos, Mexico
  "virgin voyages": { lat: 41.3851, lon: 2.1734 }, // Barcelona, Spain
  "club r calgary": { lat: 51.0447, lon: -114.0719 }, // Calgary, Canada
  hedonism: { lat: 18.2782, lon: -78.3438 }, // Negril, Jamaica

  // --- State Fallbacks (Listed AT THE VERY END so specific cities match first) ---
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
  la: { lat: 30.984298, lon: -91.962333 },
  louisiana: { lat: 30.984298, lon: -91.962333 },
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
  nm: { lat: 34.97273, lon: -105.032363 },
  "new mexico": { lat: 34.97273, lon: -105.032363 },
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
  wi: { lat: 43.78444, lon: -88.787868 },
  wisconsin: { lat: 43.78444, lon: -88.787868 },
  wy: { lat: 43.075968, lon: -107.290284 },
  wyoming: { lat: 43.075968, lon: -107.290284 },
};

/**
 * Lookup coordinates from a location string (e.g. "Arlington, VA", "Miami, FL").
 */
export function getCoordsFromLocationText(locText?: string | null): { lat: number; lon: number } | null {
  if (!locText) return null;
  const loc = locText.toLowerCase().trim();
  if (!loc) return null;

  // 1. Try specific city & venue names first (where key.length > 2)
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (key.length > 2) {
      if (loc.includes(key)) {
        return coords;
      }
    }
  }

  // 2. Try state abbreviations (where key.length <= 2)
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (key.length <= 2) {
      // Directional quadrant compass tags (ne, nw, se, sw) in venue names (e.g. "Philly NE")
      // should NOT be mistaken for Nebraska state code ("ne")
      if (["ne", "nw", "se", "sw"].includes(key)) {
        const stateRegex = new RegExp(`(?:,\\s*|\\bnebraska\\b|\\bomaha\\b|\\blincoln\\b)\\b${key}\\b`, "i");
        if (stateRegex.test(loc)) {
          return coords;
        }
      } else {
        const regex = new RegExp(`\\b${key}\\b`, "i");
        if (regex.test(loc)) {
          return coords;
        }
      }
    }
  }

  return null;
}

/**
 * Calculates straight-line distance in miles between two coordinates using Haversine formula.
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function cleanVenueText(venue?: string | null): string {
  if (!venue) return "";
  return venue
    .replace(/\s*•?\s*\d+\s*(?:miles?|mile)?\s*away/gi, "")
    .replace(/\s*,\s*away$/i, "")
    .replace(/\s+away$/i, "")
    .trim();
}

/**
 * Robustly parse partner event date strings (e.g. "Saturday Aug 29 9 PM", "Aug 29th, 2026") into ISO string.
 */
export function parsePartnerEventDate(rawDate?: string, rawTime?: string): string {
  if (!rawDate) return new Date().toISOString();
  let cleanDate = rawDate.split('\n')[0].trim();
  const combinedDateStr = `${cleanDate} ${rawTime || ""}`.trim();
  
  const timeMatch = combinedDateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const hasExplicitYear = /\b20\d{2}\b/.test(cleanDate);

  cleanDate = cleanDate.replace(/^[a-zA-Z]+day,?\s*/i, '').trim();
  cleanDate = cleanDate.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();
  cleanDate = cleanDate.replace(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i, '').trim();

  const now = new Date();
  const currentYear = now.getFullYear();
  if (!hasExplicitYear) {
    cleanDate = `${cleanDate}, ${currentYear}`;
  }

  const d = new Date(cleanDate);
  if (!isNaN(d.getTime())) {
    let year = d.getFullYear();
    if (year === 2001 || year === 1970) {
      year = currentYear;
    }
    const month = d.getMonth();
    const day = d.getDate();

    let hours = 18; // Default 6:00 PM EST if no time specified
    let minutes = 0;

    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }

    // Build ISO timestamp in America/New_York (EST) timezone
    let utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0));

    // If date without explicit year has already passed, roll forward to next year
    if (!hasExplicitYear && utcDate.getTime() < now.getTime() - 86400000) {
      year = currentYear + 1;
      utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0));
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(utcDate);
      const mapped: Record<string, number> = {};
      parts.forEach(p => {
        if (p.type !== 'literal') {
          mapped[p.type] = parseInt(p.value, 10);
        }
      });
      const nyUtc = Date.UTC(mapped.year, mapped.month - 1, mapped.day, mapped.hour, mapped.minute, mapped.second);
      const offsetMs = nyUtc - utcDate.getTime();
      return new Date(utcDate.getTime() - offsetMs).toISOString();
    } catch {
      d.setFullYear(year);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    }
  }
  return new Date().toISOString();
}

/**
 * Extract latitude and longitude for an event from raw coordinates or location text lookup.
 */
export function getEventCoords(e: any): { lat: number; lon: number } | null {
  const lat = parseFloat(e.Latitude || e.latitude || e.VenueLatitude || e.AddressLatitude || e.lat);
  const lon = parseFloat(e.Longitude || e.longitude || e.VenueLongitude || e.AddressLongitude || e.lon);
  if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
    return { lat, lon };
  }
  const loc = (
    e.Venue ||
    e.venue ||
    e.location ||
    e.location_name ||
    e.Location ||
    e.Name ||
    e.original_title ||
    e.seo_title ||
    ""
  ).toLowerCase();
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

/**
 * Helper to compute distance in miles from user coordinates for an event item.
 */
export function attachDistanceToEvent(event: any, userCoords: any): any {
  if (!userCoords) return { ...event, distanceMiles: null };
  const userLat = Number(userCoords.latitude ?? userCoords.lat);
  const userLon = Number(userCoords.longitude ?? userCoords.lon);
  if (isNaN(userLat) || isNaN(userLon)) return { ...event, distanceMiles: null };

  const coords = getEventCoords(event);
  if (!coords) return { ...event, distanceMiles: null };

  const distanceMiles = calculateDistanceMiles(
    userLat,
    userLon,
    coords.lat,
    coords.lon
  );
  if (isNaN(distanceMiles)) return { ...event, distanceMiles: null };
  return { ...event, distanceMiles: Math.round(distanceMiles) };
}

/**
 * Sort events by Distance Tiers (Local <= 100mi, Regional <= 500mi, Distant > 500mi)
 * and chronologically by date within each tier.
 */
export function sortEventsByDateAndDistance(events: any[], timeTab: "upcoming" | "past" = "upcoming"): any[] {
  return [...events].sort((a, b) => {
    const distA = typeof a.distanceMiles === "number" ? a.distanceMiles : 99999;
    const distB = typeof b.distanceMiles === "number" ? b.distanceMiles : 99999;

    // Distance Tiers: 0 <= 100mi (tier 0), 101-500mi (tier 1), >500mi (tier 2)
    const tierA = distA <= 100 ? 0 : distA <= 500 ? 1 : 2;
    const tierB = distB <= 100 ? 0 : distB <= 500 ? 1 : 2;

    if (tierA !== tierB) {
      return tierA - tierB; // Nearby distance tier ALWAYS comes first!
    }

    const timeA = new Date(a.StartTime || a.startTime || 0).getTime();
    const timeB = new Date(b.StartTime || b.startTime || 0).getTime();

    // Within same distance tier, sort chronologically by date
    if (timeA !== timeB) {
      return timeTab === "upcoming" ? timeA - timeB : timeB - timeA;
    }

    return distA - distB;
  });
}

/**
 * Format distance in miles into a user-friendly label (e.g. "< 1 mile away" when dist is 0).
 */
export function formatDistanceText(miles?: number | null): string {
  if (typeof miles !== "number" || isNaN(miles)) return "";
  if (miles === 0) return "< 1 mile away";
  if (miles === 1) return "1 mile away";
  return `${miles} miles away`;
}
