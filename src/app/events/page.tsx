import { dbPool } from '@/lib/db';
import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import EventsPageClient from "./EventsPageClient";
import { parsePartnerEventDate } from "@/utils/distance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "National Events Calendar",
  description: "Browse our National Events Calendar. Join exciting lifestyle couples resorts, cruises, takeovers, and meet & greets.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://app.swingsocial.co/events",
  },
  openGraph: {
    title: "National Events Calendar",
    description: "Browse our National Events Calendar. Join exciting lifestyle couples resorts, cruises, takeovers, and meet & greets.",
    url: "https://app.swingsocial.co/events",
    siteName: "Swing Social",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "National Events Calendar",
    description: "Browse our National Events Calendar.",
  }
};

// Caching mechanism to avoid querying PostgreSQL database on every request
let cachedSchemaEvents: any[] | null = null;
let cachedSchemaEventsTime = 0;

let cachedEventsData: any[] | null = null;
let cachedEventsDataTime = 0;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function getEventsForSchema() {
  const now = Date.now();
  if (cachedSchemaEvents && (now - cachedSchemaEventsTime) < CACHE_TTL) {
    return cachedSchemaEvents;
  }
  try {
    const query = `
      SELECT 
        id, 
        event_date, 
        location_name, 
        producer, 
        seo_title, 
        seo_description
      FROM public."Partner_Events" 
      ORDER BY id ASC
      LIMIT 10
    `;
    const result = await dbPool.query(query);
    cachedSchemaEvents = result.rows;
    cachedSchemaEventsTime = now;
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch events for schema:", error);
    return [];
  }
}

function optimizeCloudinaryUrl(url: string): string {
  if (!url) return "/images/resort_event_sample.png";
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_800/");
  }
  return url;
}

async function getEventsData() {
  const now = Date.now();
  if (cachedEventsData && (now - cachedEventsDataTime) < CACHE_TTL) {
    return cachedEventsData;
  }
  try {
    const userEventsResult = await dbPool.query('SELECT * FROM get_all_events()');
    const rawUserEvents = userEventsResult.rows || [];
    const userEvents = rawUserEvents.map((ev: any) => ({
      ...ev,
      Description: "",
      EmailDescription: "",
      CoverImageUrl: optimizeCloudinaryUrl(ev.CoverImageUrl)
    }));

    const queryPartner = `
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
        event_time,
        popup_data->>'image' as cover_image
      FROM public."Partner_Events" 
      ORDER BY id ASC
    `;
    const partnerResult = await dbPool.query(queryPartner);
    const partnerRows = partnerResult.rows || [];

    const decodeHtml = (html: string) => {
      if (!html) return "";
      return html.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'");
    };

    const partnerList = partnerRows.map((ev: any) => {
      const startTime = parsePartnerEventDate(ev.event_date, ev.event_time);

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

      const validCover = isRealFlyerImage(ev.cover_image) ? ev.cover_image : "";
      const cover = optimizeCloudinaryUrl(validCover);

      return {
        Id: `partner_${ev.id}`,
        Slug: ev.slug_name,
        Name: decodeHtml(ev.original_title || ev.seo_title || "Partner Event"),
        Category: "Partner Event",
        StartTime: startTime,
        Venue: decodeHtml(ev.location_name || ev.producer || ""),
        Description: decodeHtml(ev.seo_description || ""),
        SearchText: decodeHtml(`${ev.seo_title || ""} ${ev.original_title || ""} ${ev.location_name || ""} ${ev.seo_description || ""}`),
        CoverImageUrl: cover,
        isPartnerEvent: true
      };
    });

    const combinedEvents = [...userEvents, ...partnerList];
    cachedEventsData = combinedEvents;
    cachedEventsDataTime = now;
    return combinedEvents;
  } catch (error) {
    console.error("Failed to fetch events for initial props:", error);
    return [];
  }
}

export default async function CalendarView() {
  const [dbEvents, allEvents] = await Promise.all([
    getEventsForSchema(),
    getEventsData(),
  ]);

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") || "";
  const isMobileServer = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  const cookieStore = await cookies();
  const token = cookieStore.get("loginInfo")?.value || null;
  let initialProfileId = null;
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      initialProfileId = decoded?.profileId || null;
    } catch {
      // ignore
    }
  }

  // Construct Google JSON-LD schema for Events
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": dbEvents.map((ev: any) => {
      // Clean location name
      const loc = (ev.location_name || "").replace(/\n/g, " ").trim();

      return {
        "@type": "Event",
        "name": ev.seo_title || "Lifestyle Event",
        "startDate": new Date().toISOString(),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": loc || "TBA",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": loc || "TBA",
            "addressCountry": "US"
          }
        },
        "description": ev.seo_description || "Lifestyle event on Swing Social.",
        "organizer": {
          "@type": "Organization",
          "name": ev.producer || "Swing Social",
          "url": "https://swingsocial.co"
        }
      };
    })
  };

  return (
    <EventsPageClient
      initialEvents={allEvents}
      initialIsMobile={isMobileServer}
      initialProfileId={initialProfileId}
      jsonLd={jsonLd}
    />
  );
}
