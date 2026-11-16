import { getCachedRewrittenPartnerEvents, PartnerEvent } from "@/services/eventScraper";
import PartnerEventsClient from "./PartnerEventsClient";
import { toISODate } from "@/utils/eventDateUtils";

// Always run server-side so the in-memory cache is invoked
export const dynamic = 'force-dynamic';

const baseUrl = 'https://app.swingsocial.co';

export const metadata = {
    title: 'Partner Events — Swing Social | Social Dance & Lifestyle Events',
    description: 'Browse upcoming partner swing social events, lifestyle festivals, and community gatherings near you. Updated daily with new events from across the US.',
    keywords: 'swing social events, partner events, lifestyle events, social dance, swing dance festivals',
    robots: { index: true, follow: true },
    alternates: {
        canonical: `${baseUrl}/partner-events`,
    },
    openGraph: {
        title: 'Partner Events — Swing Social',
        description: 'Browse upcoming partner swing social events, lifestyle festivals, and community gatherings near you.',
        url: `${baseUrl}/partner-events`,
        siteName: 'Swing Social',
        images: [
            {
                url: `${baseUrl}/favicon.png`,
                width: 1200,
                height: 630,
                alt: 'Swing Social Partner Events',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Partner Events — Swing Social',
        description: 'Browse upcoming partner swing social events, lifestyle festivals, and community gatherings near you.',
        images: [`${baseUrl}/favicon.png`],
    },
};

function parseEventDate(dateStr: string): Date | null {
    const match = dateStr.match(/[A-Za-z]+\s+([A-Za-z]+)\s+(\d+)/);
    if (!match) return null;
    const [, monthStr, dayStr] = match;
    const year = new Date().getFullYear();
    const parsed = new Date(`${monthStr} ${dayStr}, ${year}`);
    if (isNaN(parsed.getTime())) return null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsed.getTime() < todayStart.getTime() - 24 * 60 * 60 * 1000) {
        parsed.setFullYear(year + 1);
    }
    return parsed;
}

function filterFutureEvents(events: PartnerEvent[]): PartnerEvent[] {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return events.filter((event) => {
        const eventDate = parseEventDate(event.when.date);
        if (!eventDate) return true;
        return eventDate.getTime() >= todayStart.getTime();
    });
}

export default async function PartnerEventsPage() {
    let events: PartnerEvent[] = [];

    try {
        const { dbPool } = await import('@/lib/db');
        const { mapDbRowToPartnerEvent } = await import('./[slug]/page');
        const result = await dbPool.query('SELECT * FROM public."Partner_Events" ORDER BY id ASC');
        const dbEvents = result.rows.map(mapDbRowToPartnerEvent);
        events = filterFutureEvents(dbEvents);
    } catch (dbErr) {
        console.error("Failed to fetch partner events from database, falling back to scraper:", dbErr);
        try {
            const allEvents = await getCachedRewrittenPartnerEvents();
            events = filterFutureEvents(allEvents);
        } catch (error) {
            console.error("Failed to fetch events from scraper fallback:", error);
        }
    }

    // ItemList JSON-LD — tells Google this page contains a list of events
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Partner Swing Social Events',
        description: 'Upcoming partner swing social events and lifestyle festivals.',
        url: `${baseUrl}/partner-events`,
        numberOfItems: events.length,
        itemListElement: events.slice(0, 50).map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${baseUrl}/partner-events/${event.slug_name || event.id}`,
            name: event.what.title,
            item: {
                '@type': 'Event',
                name: event.what.title,
                startDate: toISODate(event.when.date) ?? event.when.date,
                location: {
                    '@type': 'Place',
                    name: event.where.name,
                    address: event.where.location,
                },
            },
        })),
    };

    // BreadcrumbList JSON-LD
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: baseUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Partner Events',
                item: `${baseUrl}/partner-events`,
            },
        ],
    };

    return (
        <>
            <div style={{ display: 'none' }}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                />
            </div>
            <PartnerEventsClient initialEvents={events} />
        </>
    );
}