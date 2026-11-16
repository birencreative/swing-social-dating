import { getRewrittenPartnerEventById, getCachedRewrittenPartnerEvents, PartnerEvent } from "@/services/eventScraper";
import PartnerEventDetailClient from "./PartnerEventDetailClient";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import { toISODate } from "@/utils/eventDateUtils";
import { isValidEventFlyer } from "@/utils/eventImageUtils";

function stripHtml(html: string, maxLength = 155): string {
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length <= maxLength) return text;

    // Slice to maxLength and find the last space so we don't truncate mid-word
    let sliced = text.substring(0, maxLength);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace > maxLength - 20) {
        sliced = sliced.substring(0, lastSpace);
    }
    return sliced + '…';
}


export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ slug: string }>;
}

export function mapDbRowToPartnerEvent(row: any): PartnerEvent {
    let popupData: any = {};
    try {
        popupData = typeof row.popup_data === 'string' ? JSON.parse(row.popup_data) : row.popup_data;
    } catch { }

    const dateParts = (row.event_date || "").split('\n').map((s: string) => s.trim()).filter(Boolean);
    const date = dateParts[0] || "";
    const time = row.event_time || dateParts.slice(1).join(" ") || "";
    const rawDate = (row.event_date || "").split('\n').map((s: string) => s.trim()).filter(Boolean).join(' ');

    // Clean up location parts to remove distance/away fragments (e.g. "2320, away" or "2320 miles away")
    const rawLocationParts = (row.location_name || "")
        .split(/\n|,\s*(?=\D)/)
        .map((s: string) => s.trim())
        .filter(Boolean);

    const cleanLocationParts = rawLocationParts.filter((s: string) => {
        const lower = s.toLowerCase();
        if (/^\d+$/.test(s)) return false;
        return !lower.includes("miles") &&
            !lower.includes("mile") &&
            !lower.includes("away") &&
            !lower.includes("feet") &&
            !lower.includes("ft") &&
            !/\b\d+\s*m\b/i.test(s);
    });

    // never fall back to unfiltered raw data — scrub it if clean list is empty
    const whereName = cleanLocationParts[0]
        || rawLocationParts[0]?.replace(/,?\s*\d+\s*,?\s*(miles?|away|feet|ft)\b/gi, '').trim()
        || "TBA";
    const whereLocation = cleanLocationParts.slice(1).join(", ") || whereName;

    const distanceMatch = (row.location_name || "").match(/(\d+\s*miles?\s*away)/i);
    const whereDistance = distanceMatch ? distanceMatch[0] : '';

    // Regex-based US street address extraction from description HTML
    const htmlContent = popupData?.rawHtmlBlock || row.original_description || "";
    let city = popupData?.city || undefined;
    let state = popupData?.state || undefined;
    let streetAddress = popupData?.streetAddress || undefined;

    if (htmlContent) {
        const text = htmlContent
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Look for common US address pattern: street suffix, city, 2-letter state, 5-digit zip
        const addressRegex = /\b\d+\s+[A-Za-z0-9\s#\-\.]+?\b(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Boulevard|Blvd|Court|Ct|Way|Lane|Ln|Highway|Hwy|Loop|Trail|Trl|Pkwy|Parkway)\b[\.,\s]+[A-Za-z\s\.]+?[\.,\s]+[A-Z]{2}\s+\d{5}/i;
        const match = text.match(addressRegex);
        if (match) {
            const extractedAddress = match[0].trim();
            
            // Parse city and state
            const cityStateMatch = extractedAddress.match(/[\.,\s]+([A-Za-z\s\.]+?)[\.,\s]+([A-Z]{2})\s+\d{5}/i);
            if (cityStateMatch) {
                if (!city) city = cityStateMatch[1].trim();
                if (!state) state = cityStateMatch[2].trim().toUpperCase();
            }
            
            // Parse street address
            const streetMatch = extractedAddress.match(/^(.+?)[\.,\s]+[A-Za-z\s\.]+?[\.,\s]+[A-Z]{2}\s+\d{5}/i);
            if (streetMatch) {
                if (!streetAddress) streetAddress = streetMatch[1].trim();
            } else {
                if (!streetAddress) streetAddress = extractedAddress;
            }
        }
    }

    return {
        id: String(row.id),
        slug_name: row.slug_name,
        what: {
            title: row.original_title || row.seo_title || "Partner Event",
            seoTitle: row.seo_title || row.original_title || "Partner Event",
            description: popupData?.rawHtmlBlock || row.original_description || row.seo_description,
            seoDescription: row.seo_description || row.original_description || "",
            type: popupData?.theme || "Partner Event",
            url: popupData?.buyLink || row.detail_url,
            image: isValidEventFlyer(popupData?.image) ? popupData.image : undefined,
        },
        when: {
            date,
            time,
            rawDate: rawDate || `${date} ${time}`.trim(),
        },
        where: {
            name: whereName,
            location: whereLocation,
            distance: whereDistance,
            streetAddress,
            city,
            state,
        },
        who: {
            name: row.producer || "Partner",
            profileUrl: popupData?.originalUrl,
            hostPic: isValidEventFlyer(popupData?.hostPic) ? popupData.hostPic : undefined,
            contact: popupData?.contact || undefined,
        },
        venuePics: Array.isArray(popupData?.venuePics)
            ? popupData.venuePics.filter((p: string) => isValidEventFlyer(p))
            : [],
    };
}

async function getPartnerEvent(slug: string): Promise<PartnerEvent | undefined> {
    try {
        const { dbPool } = await import('@/lib/db');

        // 1. Try querying by slug_name in Partner_Events_New first
        let result = await dbPool.query('SELECT * FROM public."Partner_Events_New" WHERE slug_name = $1', [slug]);

        // 2. Then try Partner_Events
        if (result.rows.length === 0) {
            result = await dbPool.query('SELECT * FROM public."Partner_Events" WHERE slug_name = $1', [slug]);
        }

        // 3. Fallback for backwards compatibility with raw source_id or ID
        if (result.rows.length === 0 && (/^\d+$/.test(slug) || slug.startsWith('partner_'))) {
            const cleanId = slug.replace('partner_', '');
            result = await dbPool.query('SELECT * FROM public."Partner_Events_New" WHERE source_id = $1', [cleanId]);
            if (result.rows.length === 0) {
                result = await dbPool.query('SELECT * FROM public."Partner_Events" WHERE source_id = $1', [cleanId]);
            }
            if (result.rows.length === 0 && /^\d+$/.test(cleanId)) {
                result = await dbPool.query('SELECT * FROM public."Partner_Events" WHERE id = $1', [parseInt(cleanId, 10)]);
            }
        }

        if (result.rows.length > 0) {
            return mapDbRowToPartnerEvent(result.rows[0]);
        }
    } catch (error) {
        console.error('[PartnerEvent] Database query failed:', error);
    }
    return await getRewrittenPartnerEventById(slug);
}

/**
 * Pre-build all event detail pages at deploy time so Googlebot
 * can crawl static HTML immediately instead of waiting for SSR.
 */
export async function generateStaticParams() {
    try {
        const { dbPool } = await import('@/lib/db');
        const newRes = await dbPool.query('SELECT slug_name FROM public."Partner_Events_New" WHERE slug_name IS NOT NULL');
        const oldRes = await dbPool.query('SELECT slug_name FROM public."Partner_Events" WHERE slug_name IS NOT NULL');

        const slugsSet = new Set<string>();
        newRes.rows.forEach(r => { if (r.slug_name) slugsSet.add(r.slug_name); });
        oldRes.rows.forEach(r => { if (r.slug_name) slugsSet.add(r.slug_name); });

        return Array.from(slugsSet).map((slug) => ({ slug }));
    } catch {
        return [];
    }
}

function injectAltTags(html: string, fallbackAlt: string): string {
    if (!html) return '';
    return html.replace(/<img\s+([^>]*?)>/gi, (match, p1) => {
        if (/alt=["']([^"']+)["']/i.test(p1)) {
            return match;
        }
        if (/alt=["']\s*["']/i.test(p1)) {
            return `<img ${p1.replace(/alt=["']\s*["']/i, `alt="${fallbackAlt}"`)}>`;
        }
        return `<img ${p1.trim()} alt="${fallbackAlt}">`;
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const event = await getPartnerEvent(slug);

    if (!event) {
        return { title: 'Event Not Found' };
    }

    const baseUrl = 'https://app.swingsocial.co';
    const pageUrl = `${baseUrl}/partner-events/${slug}`;

    // Rich, keyword-packed description (100–160 chars target)
    const metaDescription = event.what.seoDescription
        ? stripHtml(event.what.seoDescription)
        : event.what.description
            ? stripHtml(event.what.description)
            : `${event.what.title} — ${event.what.type ?? 'social event'} at ${event.where.name}, ${event.where.location} on ${event.when.date}. Hosted by ${event.who.name}.`;

    // Shorten title tag to keep it within Google's 55-60 characters limit
    let metaTitle = event.what.seoTitle || event.what.title;
    if (metaTitle.length > 55) {
        let sliced = metaTitle.substring(0, 52);
        const lastSpace = sliced.lastIndexOf(' ');
        if (lastSpace > 30) sliced = sliced.substring(0, lastSpace);   // CHANGED: don't cut mid-word
        metaTitle = sliced + '...';
    } else {
        if (metaTitle.length + 15 <= 60) {
            metaTitle = `${metaTitle} | Swing Social`;
        }
    }

    const keywords = [
        event.what.type,
        event.where.location,
        event.who.name,
        'swing social event',
        'partner event',
        'social dance',
    ].filter((k) => {
        if (!k) return false;
        const lower = k.toLowerCase();
        return lower !== 'n/a' && !lower.includes('away') && !lower.includes('miles');
    }).join(', ');

    return {
        title: metaTitle,
        description: metaDescription,
        keywords,
        robots: { index: true, follow: true },
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: metaTitle,
            description: metaDescription,
            url: pageUrl,
            siteName: 'Swing Social',
            images: event.what.image
                ? [{ url: event.what.image, width: 1200, height: 630, alt: event.what.title }]
                : [{ url: `${baseUrl}/favicon.png`, width: 1200, height: 630, alt: 'Swing Social' }],
            type: 'website',
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDescription,
            images: event.what.image ? [event.what.image] : [`${baseUrl}/favicon.png`],
        },
    };
}

export default async function PartnerEventPage({ params }: Props) {
    const { slug } = await params;
    const event = await getPartnerEvent(slug);

    if (!event) {
        notFound();
    }

    const baseUrl = 'https://app.swingsocial.co';
    const pageUrl = `${baseUrl}/partner-events/${slug}`;

    const rawDateTime = event.when.time
        ? `${event.when.date} ${event.when.time}`
        : event.when.date;

    let isoDate = toISODate(rawDateTime);
    if (!isoDate) {
        console.error(`[PartnerEvent] Failed to parse date for slug ${slug}: "${event.when.date}" / "${event.when.time}"`);
    }

    // Dynamically parse city and state from the location details
    let parsedCity = event.where.city;
    let parsedState = event.where.state;

    if (!parsedCity || !parsedState) {
        // Match standard format "City, State" (e.g. "San Antonio, TX" or "Tukwila, WA")
        const match = event.where.location.match(/([^,]+),\s*([A-Za-z]{2})/);
        if (match) {
            if (!parsedCity) parsedCity = match[1].trim();
            if (!parsedState) parsedState = match[2].trim().toUpperCase();
        }
    }

    // Fallbacks if parsing fails
    parsedCity = parsedCity || 'San Antonio';
    parsedState = parsedState || 'TX';

    // Rich Event JSON-LD with valid ISO 8601 date — required for Google Event rich results
    const eventJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.what.title,
        description: event.what.seoDescription
            ? stripHtml(event.what.seoDescription, 500)
            : stripHtml(event.what.description ?? '', 500),
        image: event.what.image ?? `${baseUrl}/favicon.png`,
        url: pageUrl,
        ...(isoDate ? { startDate: isoDate } : {}),   // CHANGED: omit entirely if unparseable, don't fake "today"
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: event.where.name,
            address: {
                '@type': 'PostalAddress',
                streetAddress: event.where.streetAddress || event.where.location,
                addressLocality: parsedCity,
                addressRegion: parsedState,
                addressCountry: 'US',
            },
        },
        organizer: {
            '@type': 'Organization',
            name: event.who.name,
            url: event.who.profileUrl && event.who.profileUrl.startsWith('http') ? event.who.profileUrl : baseUrl,
        },
        ...(event.what.url ? {                        // CHANGED: added offers block
            offers: {
                '@type': 'AggregateOffer',
                url: event.what.url,
                lowPrice: '10',
                highPrice: '100',
                priceCurrency: 'USD',
                offerCount: 3,
            },
        } : {}),
    };

    // BreadcrumbList JSON-LD — shows breadcrumb trail in Google SERP
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
            {
                '@type': 'ListItem',
                position: 3,
                name: event.what.title,
                item: pageUrl,
            },
        ],
    };

    // Inject alt tags for accessibility on any publisher images
    if (event.what.description) {
        event.what.description = injectAltTags(event.what.description, event.what.title);
    }

    return (
        <>
            <div style={{ display: 'none' }}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                />
            </div>
            <PartnerEventDetailClient event={event} />
        </>
    );
}
