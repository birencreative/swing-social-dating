import { dbPool } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateEventSeo } from "@/utils/aiSeo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { eventId, isPartner } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required parameter: eventId" },
        { status: 400 }
      );
    }

    if (isPartner) {
      // Fetch partner event details
      let queryStr = `SELECT * FROM public."Partner_Events" WHERE id = $1`;
      let queryVal: any = parseInt(eventId, 10);
      if (isNaN(queryVal)) {
        // Query by slug if not a numeric ID
        queryStr = `SELECT * FROM public."Partner_Events" WHERE slug_name = $1`;
        queryVal = eventId;
      }
      
      const result = await dbPool.query(queryStr, [queryVal]);
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Partner event not found" },
          { status: 404 }
        );
      }

      const event = result.rows[0];
      const title = event.original_title || "Partner Event";
      let popupData: any = {};
      try {
        popupData = typeof event.popup_data === "string" ? JSON.parse(event.popup_data) : event.popup_data;
      } catch {}
      
      const desc = popupData?.rawHtmlBlock || event.original_description || event.seo_description || "";
      const venue = event.location_name || "TBA";
      const date = `${event.event_date || ""} ${event.event_time || ""}`.trim();

      console.log(`[AI SEO] Generating SEO for partner event: ${title}`);
      const seo = await generateEventSeo(title, desc, "Partner Event", venue, date);

      // Save SEO metadata
      await dbPool.query(
        `UPDATE public."Partner_Events" SET seo_title = $1, seo_description = $2 WHERE id = $3`,
        [seo.seoTitle, seo.seoDescription, event.id]
      );

      return NextResponse.json({
        success: true,
        eventId,
        seoTitle: seo.seoTitle,
        seoDescription: seo.seoDescription,
      });

    } else {
      // Fetch user event details
      const result = await dbPool.query(`SELECT * FROM public.event_get_details($1)`, [eventId]);
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "User event not found" },
          { status: 404 }
        );
      }

      const event = result.rows[0];
      const title = event.Name || "Event";
      const desc = event.Description || "";
      const category = event.Category || "Lifestyle Event";
      const venue = event.Venue || "TBA";
      const date = event.StartTime ? new Date(event.StartTime).toLocaleString("en-US", { timeZone: "America/New_York" }) : "TBA";

      console.log(`[AI SEO] Generating SEO for user event: ${title}`);
      const seo = await generateEventSeo(title, desc, category, venue, date);

      // Save SEO metadata
      await dbPool.query(
        `UPDATE public."Events" SET "seo_title" = $1, "seo_description" = $2 WHERE "Id" = $3::uuid`,
        [seo.seoTitle, seo.seoDescription, eventId]
      );

      return NextResponse.json({
        success: true,
        eventId,
        seoTitle: seo.seoTitle,
        seoDescription: seo.seoDescription,
      });
    }

  } catch (error: any) {
    console.error("[AI SEO] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
