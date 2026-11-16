import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import moment from "moment";


export async function POST(req: Request) {
  try {
    const {
      profileId,
      startTime,
      endTime,
      eventName,
      description,
      category,
      isVenueHidden,
      venue,
      coverImageURL,
      emailDescription,
      images,
      longitude,
      latitude,
      repeats,
      hideTicketOption,
      allowFreeUsers,
      seoTitle,
      seoDescription
    } = await req.json();

    if (
      !profileId ||
      !startTime ||
      !endTime ||
      !eventName ||
      !category ||
      !venue
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: profileId, startTime, endTime, eventName, category, venue",
        },
        { status: 400 }
      );
    }

    const imagesArray = images.map((url: string) => url).join(",");

    const insertQuery = `SELECT * FROM public.event_insert($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;
    const insertValues = [
      profileId,
      startTime,
      endTime,
      eventName,
      description,
      category,
      isVenueHidden,
      venue,
      coverImageURL,
      emailDescription,
      imagesArray,
      latitude,
      longitude,
      hideTicketOption,
      allowFreeUsers
    ];

    const result = await dbPool.query(insertQuery, insertValues);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    const newEventId = result.rows[0].EventId;
    if (seoTitle || seoDescription) {
      await dbPool.query(
        `UPDATE public."Events" SET "seo_title" = $1, "seo_description" = $2 WHERE "Id" = $3::uuid`,
        [seoTitle || null, seoDescription || null, newEventId]
      );
    }

    return NextResponse.json({
      message: "Your event is created successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("Database query failed:", error);
    return NextResponse.json({
      message: "Sorry, we are unable to process it. Please try again.",
      status: 500,
    });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    if (eventId) {
      const eventQuery = `SELECT * FROM public.event_get_details($1)`;
      const eventValues = [eventId];
      const eventResult = await dbPool.query(eventQuery, eventValues);

      if (eventResult.rows.length === 0) {
        return NextResponse.json(
          { error: `No event found with ID ${eventId}` },
          { status: 404 }
        );
      }

      const event = eventResult.rows[0];

      const rsvpQuery = `SELECT * FROM event_rsvp_attendees($1, 'rsvp')`;
      const attendeesQuery = `SELECT * FROM event_rsvp_attendees($1, 'attendees')`;
      const ticketsQuery = `SELECT * FROM get_event_ticket_packages($1)`;

      const [rsvpResult, attendeesResult, ticketsResult] = await Promise.all([
        dbPool.query(rsvpQuery, [eventId]),
        dbPool.query(attendeesQuery, [eventId]),
        dbPool.query(ticketsQuery, [eventId]),
      ]);

      const rsvp = rsvpResult.rows;
      const attendees = attendeesResult.rows;
      const tickets = ticketsResult.rows;

      // Group attendees by ticket type/name - ensure field names match
      const attendeeCountByType = attendees.reduce((acc, attendee) => {
        // Use the correct field name that matches the ticket.Name field
        const type =
          attendee.TicketType || attendee.Name || attendee.ticketName;
        if (type) {
          acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
      }, {});

      const ticketsWithRemainingQty = tickets.map((ticket) => {
        const attendeeCount = attendeeCountByType[ticket.Name] || 0;
        const remainingQuantity = Math.max(0, ticket.Quantity - attendeeCount);

        return {
          ...ticket,
          Quantity: remainingQuantity,
          OriginalQuantity: ticket.Quantity,
          SoldCount: attendeeCount,
        };
      });

      return NextResponse.json({
        event,
        rsvp,
        attendees,
        tickets: ticketsWithRemainingQty,
      });
    } else {
      let query = `SELECT * FROM get_all_events()`;
      const conditions: string[] = [];
      const values: any[] = [];
      const profilesResult = await dbPool.query(query, values);
      return NextResponse.json({
        events: profilesResult.rows,
      });
    }
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
