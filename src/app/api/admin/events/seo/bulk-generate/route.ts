import { dbPool } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateEventSeo } from "@/utils/aiSeo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let limit = 5;
    try {
      const body = await req.json();
      if (body && typeof body.limit === "number") {
        limit = body.limit;
      }
    } catch {}

    let processedUserEvents = 0;
    let processedPartnerEvents = 0;

    // 1. Fetch user events missing customized SEO title
    const userEventsRes = await dbPool.query(
      `SELECT "Id", "Name", "Description", "Category", "Venue", "StartTime"
       FROM public."Events" 
       WHERE "seo_title" IS NULL OR "seo_title" = '' 
       LIMIT $1`,
      [limit]
    );

    for (const row of userEventsRes.rows) {
      const eventId = row.Id;
      const title = row.Name || "Event";
      const desc = row.Description || "";
      const category = row.Category || "Lifestyle Event";
      const venue = row.Venue || "TBA";
      const date = row.StartTime ? new Date(row.StartTime).toLocaleString("en-US", { timeZone: "America/New_York" }) : "TBA";

      try {
        console.log(`[Bulk AI SEO] Generating for user event: ${title}`);
        const seo = await generateEventSeo(title, desc, category, venue, date);
        await dbPool.query(
          `UPDATE public."Events" SET "seo_title" = $1, "seo_description" = $2 WHERE "Id" = $3::uuid`,
          [seo.seoTitle, seo.seoDescription, eventId]
        );
        processedUserEvents++;
        // Small delay to prevent rate-limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[Bulk AI SEO] Failed for user event ${eventId}:`, err);
      }
    }

    // 2. Fetch partner events missing customized SEO title
    const remainingLimit = limit - processedUserEvents;
    if (remainingLimit > 0) {
      const partnerEventsRes = await dbPool.query(
        `SELECT id, original_title, original_description, seo_description, location_name, event_date, event_time, popup_data
         FROM public."Partner_Events" 
         WHERE seo_title IS NULL OR seo_title = '' OR seo_title = original_title
         LIMIT $1`,
        [remainingLimit]
      );

      for (const row of partnerEventsRes.rows) {
        const eventId = row.id;
        const title = row.original_title || "Partner Event";
        let popupData: any = {};
        try {
          popupData = typeof row.popup_data === "string" ? JSON.parse(row.popup_data) : row.popup_data;
        } catch {}

        const desc = popupData?.rawHtmlBlock || row.original_description || row.seo_description || "";
        const venue = row.location_name || "TBA";
        const date = `${row.event_date || ""} ${row.event_time || ""}`.trim();

        try {
          console.log(`[Bulk AI SEO] Generating for partner event: ${title}`);
          const seo = await generateEventSeo(title, desc, "Partner Event", venue, date);
          await dbPool.query(
            `UPDATE public."Partner_Events" SET seo_title = $1, seo_description = $2 WHERE id = $3`,
            [seo.seoTitle, seo.seoDescription, eventId]
          );
          processedPartnerEvents++;
          // Small delay to prevent rate-limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`[Bulk AI SEO] Failed for partner event ${eventId}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedUserEvents,
      processedPartnerEvents,
      totalProcessed: processedUserEvents + processedPartnerEvents
    });

  } catch (error: any) {
    console.error("[Bulk AI SEO] Fatal Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
