import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// Simple in-memory server cache
let cachedResponse: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

export async function GET() {
  const now = Date.now();
  if (cachedResponse && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    console.log('[api/sample] Serving optimized partner events from memory cache');
    return NextResponse.json(cachedResponse);
  }

  try {
    const query = `
      SELECT 
        id, 
        event_date,
        event_time, 
        location_name, 
        producer, 
        seo_title, 
        original_title, 
        seo_description,
        slug_name,
        popup_data->>'image' as cover_image
      FROM public."Partner_Events" 
      ORDER BY id ASC
    `;
    const result = await dbPool.query(query);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No events found.' }, { status: 404 });
    }

    const isRealFlyerImage = (img: string | null | undefined) => {
      if (!img || typeof img !== 'string') return false;
      const lower = img.toLowerCase();
      if (
        lower.includes('logo') ||
        lower.includes('swingsocial') ||
        lower.includes('swing-social') ||
        lower.includes('default') ||
        lower.includes('placeholder') ||
        lower.includes('resort_event_sample')
      ) {
        return false;
      }
      return true;
    };

    const optimizedEvents = result.rows.map((row: any) => {
      const validCover = isRealFlyerImage(row.cover_image) ? row.cover_image : "";
      return {
        id: row.id,
        slug_name: row.slug_name,
        event_date: row.event_date,
        event_time: row.event_time,
        location_name: row.location_name,
        producer: row.producer,
        seo_title: row.seo_title,
        original_title: row.original_title,
        seo_description: row.seo_description,
        original_description: row.seo_description || "",
        popup_data: validCover ? { image: validCover } : {}
      };
    });

    cachedResponse = {
      totalEventsProcessed: optimizedEvents.length,
      events: optimizedEvents
    };
    cacheTimestamp = now;

    console.log(`[api/sample] Fetched from DB and cached ${optimizedEvents.length} events`);
    return NextResponse.json(cachedResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

