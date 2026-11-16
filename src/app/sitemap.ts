import { dbPool } from '@/lib/db';
import { MetadataRoute } from 'next';
import { getCachedRewrittenPartnerEvents } from '@/services/eventScraper';
import { toISODate, isWithinDays } from '@/utils/eventDateUtils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://app.swingsocial.co';

    let events: any[] = [];
    try {
        // Query Partner_Events only
        const result = await dbPool.query('SELECT slug_name, id, event_date FROM public."Partner_Events" ORDER BY id ASC');
        events = result.rows;
    } catch (error) {
        console.error('Sitemap: Failed to fetch partner events from DB', error);
        try {
            events = await getCachedRewrittenPartnerEvents();
        } catch (err2) {
            console.error('Sitemap: Fallback scraper failed', err2);
        }
    }

    let standardEvents: any[] = [];
    try {
        const result = await dbPool.query(`SELECT * FROM get_all_events()`);
        standardEvents = result.rows;
    } catch (error) {
        console.error('Sitemap: Failed to fetch standard events', error);
    }

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/events`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/partner-events`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Dynamic partner event routes (/partner-events/[slug])
    const partnerEventRoutes: MetadataRoute.Sitemap = events.map((event) => {
        const slug = event.slug_name || event.id;
        const dateStr = event.event_date || (event.when && event.when.date) || "";
        const isoDate = toISODate(dateStr);
        const isSoon = isoDate ? isWithinDays(isoDate, 7) : false;
        return {
            url: `${baseUrl}/partner-events/${slug}`,
            lastModified: new Date(),
            changeFrequency: isSoon ? 'daily' : 'weekly',
            priority: isSoon ? 0.8 : 0.6,
        };
    });

    // Dynamic standard event routes (/events/detail/[id])
    const standardEventRoutes: MetadataRoute.Sitemap = standardEvents.map((event) => {
        const eventId = event.Id || event.id; // handle case sensitivity
        return {
            url: `${baseUrl}/events/detail/${eventId}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        };
    });

    return [...staticRoutes, ...partnerEventRoutes, ...standardEventRoutes];
}
