import { dbPool } from '@/lib/db';
import { Metadata, ResolvingMetadata } from "next";


type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;

  try {
    const eventQuery = `SELECT * FROM public.event_get_details($1)`;
    const eventValues = [id];
    const eventResult = await dbPool.query(eventQuery, eventValues);

    if (eventResult.rows.length > 0) {
      const event = eventResult.rows[0];

      const title = event.seo_title 
        ? event.seo_title 
        : (event.Name ? `${event.Name} - Swing Social` : "Event Details - Swing Social");

      // Strip HTML tags from description for SEO
      let description = "";
      if (event.seo_description) {
        description = event.seo_description;
      } else {
        const rawDescription = event.Description || "";
        const strippedDescription = rawDescription.replace(/<[^>]*>?/gm, '');
        description = strippedDescription.substring(0, 160) || "View event details on Swing Social.";
      }

      const imageUrl = event.CoverImageUrl || event.Avatar || "/logo.png";

      return {
        title,
        description,
        robots: { index: true, follow: true },
        alternates: {
          canonical: `https://app.swingsocial.co/events/detail/${id}`,
        },
        openGraph: {
          title,
          description,
          images: [imageUrl],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error("Error fetching event metadata:", error);
  }

  return {
    title: "Event Details - Swing Social",
    description: "View event details on Swing Social.",
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://app.swingsocial.co/events/detail/${id}`,
    },
  };
}

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jsonLd = null;

  try {
    const eventQuery = `SELECT * FROM public.event_get_details($1)`;
    const eventValues = [id];
    const eventResult = await dbPool.query(eventQuery, eventValues);

    if (eventResult.rows.length > 0) {
      const event = eventResult.rows[0];
      const rawDescription = event.seo_description || event.Description || "";
      const strippedDescription = rawDescription.replace(/<[^>]*>?/gm, "");
      const imageUrl = event.CoverImageUrl || event.Avatar || "/logo.png";

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.Name,
        "description": strippedDescription.substring(0, 300),
        "startDate": event.StartTime,
        "endDate": event.EndTime,
        "image": imageUrl.startsWith("http") ? imageUrl : `https://app.swingsocial.co${imageUrl}`,
        "location": {
          "@type": "Place",
          "name": event.Venue || "Venue TBD",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": event.Venue || "",
            "addressCountry": "US"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "Swing Social",
          "url": "https://app.swingsocial.co"
        },
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled"
      };
    }
  } catch (error) {
    console.error("Error generating JSON-LD:", error);
  }

  return (
    <>
      {jsonLd && (
        <div style={{ display: 'none' }}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </div>
      )}
      {children}
    </>
  );
}
