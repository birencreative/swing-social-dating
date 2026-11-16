import * as cheerio from 'cheerio';

export interface PartnerEvent {
    id: string;
    slug_name?: string;
    what: {
        title: string;
        seoTitle?: string;
        description?: string;
        seoDescription?: string;
        type?: string;
        url?: string;
        image?: string;
    };
    when: {
        date: string;
        time: string;
        rawDate?: string;
    };
    where: {
        name: string;
        location: string;
        distance: string;
        streetAddress?: string;   // NEW
        city?: string;            // NEW
        state?: string;           // NEW
    };
    who: {
        name: string;
        profileUrl?: string;
        hostPic?: string;
        contact?: string;
    };
    venuePics?: string[];
}

function generateEventId(event: Partial<PartnerEvent>): string {
    return Buffer.from(
        `${event.what?.title}-${event.when?.date}-${event.where?.name}`
    ).toString('base64').substring(0, 12);
}

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://swingsocialevents.co/',
    'Origin': 'https://swingsocialevents.co',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive',
};

async function fetchPageHtml(url: string, attempt = 1): Promise<string> {
    const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        cache: 'no-store', // bypass Next.js automatic fetch cache
    });

    // Retry on rate-limit or server errors with exponential backoff
    if ((response.status === 429 || response.status >= 500) && attempt <= 3) {
        const delay = attempt * 3000; // 3s, 6s, 9s
        console.warn(`[EventScraper] ${response.status} on attempt ${attempt} — retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchPageHtml(url, attempt + 1);
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
}

function parseEventsFromHtml(html: string, baseUrl: string): PartnerEvent[] {
    const $ = cheerio.load(html);
    const events: PartnerEvent[] = [];

    $('#event_list tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 6) return;
        const nameCell = $(cells[1]);
        if (!nameCell.hasClass('name')) return;

        const thumbCell = $(cells[0]);
        const dateCell = $(cells[2]);
        const locationCell = $(cells[3]);
        const hostCell = $(cells[4]);

        const titleLink = nameCell.find('a').first();
        const whatTitle = titleLink.text().trim() || nameCell.text().trim().split('\n')[0].trim();
        const whatUrl = titleLink.attr('href');
        const whatDesc = nameCell.find('#event_description').text().trim();
        const typeText = nameCell.contents().filter((_, el) => el.type === 'text').last().text().trim();
        const whatType = typeText || undefined;
        const whatImage = thumbCell.find('img').attr('src') || undefined;

        const whenDate = dateCell.contents().first().text().trim();
        const whenTime = dateCell.find('br').length ? dateCell.html()?.split('<br>')[1]?.trim() || '' : '';
        const cleanTime = whenTime.replace(/<[^>]*>/g, '').trim();

        const venueLink = locationCell.find('a').first();
        const whereName = venueLink.text().trim() || locationCell.contents().first().text().trim();
        const locationText = locationCell.text();
        const locationParts = locationText.split('\n').map(s => s.trim()).filter(Boolean);
        let whereLocation = '';
        if (locationParts.length >= 2) {
            whereLocation = locationParts[1];
        }
        const distanceMatch = locationText.match(/(\d+\s*miles?\s*away)/i);
        const whereDistance = distanceMatch ? distanceMatch[0] : '';

        const hostNameSpan = hostCell.find('span.notranslate').first();
        const whoName = hostNameSpan.text().trim() || hostCell.find('a').first().text().trim();
        const whoProfile = hostCell.find('a').attr('href');

        const event: PartnerEvent = {
            id: generateEventId({
                what: { title: whatTitle },
                when: { date: whenDate, time: cleanTime },
                where: { name: whereName, location: whereLocation, distance: whereDistance },
            }),
            what: {
                title: whatTitle,
                description: whatDesc || undefined,
                type: whatType,
                url: whatUrl ? new URL(whatUrl, baseUrl).href : undefined,
                image: whatImage,
            },
            when: {
                date: whenDate,
                time: cleanTime,
            },
            where: {
                name: whereName,
                location: whereLocation,
                distance: whereDistance,
            },
            who: {
                name: whoName,
                profileUrl: whoProfile,
            },
        };

        if (event.what.title) {
            events.push(event);
        }
    });

    return events;
}

function getCurrentDateFormatted(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();

    return `${month}/${day}/${year}`;
}

export async function fetchAllPartnerEvents(): Promise<PartnerEvent[]> {
    const baseUrl = 'https://swingsocialevents.co';

    // Same search format
    const initialParams = new URLSearchParams([
        ['search_criteria[start_date]', getCurrentDateFormatted()],
        ['search_criteria[days_from]', 'unlimited'],
        ['search_criteria[less_more]', 'more than'],
        ['search_criteria[distance_from]', '0'],
        ['search_criteria[distance_uom]', 'miles'],
        ['search_criteria[location_name]', ''],
        ['origin[]', '38.8904'],
        ['origin[]', '-77.0842'],
    ]);

    let page = 1;
    let hasMore = true;
    const allEvents: PartnerEvent[] = [];

    while (hasMore && page <= 20) {
        const url = `${baseUrl}/events/partner_events?${initialParams.toString()}&page=${page}`;
        console.log(`Scraping page ${page}: ${url}`);

        const html = await fetchPageHtml(url);
        const pageEvents = parseEventsFromHtml(html, baseUrl);

        if (pageEvents.length === 0) {
            hasMore = false;
        } else {
            allEvents.push(...pageEvents);
            page++;
        }

        // Delay between pages — be gentle to avoid rate-limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return allEvents;
}

// ---------------------------------------------------------------------------
// Gemini-rewritten variants (Deprecated - returning raw data directly)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Simple in-memory cache — avoids unstable_cache persistence issues
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
    data: T;
    fetchedAt: number;
}

let rawCache: CacheEntry<PartnerEvent[]> | null = null;

function isFresh<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

/** Returns raw (non-rewritten) partner events. Cached in memory for 1 hour. */
export async function getCachedPartnerEvents(): Promise<PartnerEvent[]> {
    if (isFresh(rawCache)) {
        console.log('[EventScraper] Serving raw events from in-memory cache.');
        return rawCache.data;
    }
    console.log('[EventScraper] Fetching fresh raw events...');
    const data = await fetchAllPartnerEvents();
    rawCache = { data, fetchedAt: Date.now() };
    return data;
}

/** Returns Gemini-rewritten partner events (Deprecated: bypassed to raw data). */
export async function getCachedRewrittenPartnerEvents(): Promise<PartnerEvent[]> {
    return getCachedPartnerEvents();
}

/** Force-clears cache. */
export function clearEventCache(): void {
    rawCache = null;
    console.log('[EventScraper] In-memory cache cleared.');
}

export async function getPartnerEventById(id: string): Promise<PartnerEvent | undefined> {
    const events = await getCachedPartnerEvents();
    return events.find(e => e.id === id);
}

export async function getRewrittenPartnerEventById(id: string): Promise<PartnerEvent | undefined> {
    return getPartnerEventById(id);
}

