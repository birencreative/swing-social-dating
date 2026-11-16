import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { profileId, payload } = await req.json();

    const updateAttendeeQuery =
      "SELECT * FROM public.event_insert_attendee($1, $2)";

    const parsedPayload =
      typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!Array.isArray(parsedPayload)) {
      console.error("Payload is not an array:", payload);
      return NextResponse.json(
        { error: "Payload must be an array of items" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      parsedPayload.map(async (item) => {
        const response = await dbPool.query(updateAttendeeQuery, [
          profileId,
          item.id,
        ]);
        if (!response?.rows[0]) {
          throw new Error(`Failed to add attendee for item ${item.id}`);
        }
        return response.rows[0];
      })
    );

    return NextResponse.json(
      {
        message: "Successfully added attendees",
        results: results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding attendees:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add attendees",
      },
      { status: 500 }
    );
  }
}
