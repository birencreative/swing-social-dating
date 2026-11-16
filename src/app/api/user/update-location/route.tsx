import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ProfileId, latitude, longitude, Location } = await req.json();

    if (!ProfileId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: "Missing required fields: ProfileId, latitude, or longitude" },
        { status: 400 }
      );
    }

    const query = "SELECT public.update_user_full_location_by_profile(($1)::uuid, ($2)::text, ($3)::numeric, ($4)::numeric)";
    await dbPool.query(query, [ProfileId, Location, latitude, longitude]);

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      location: Location
    });

  } catch (error: any) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      {
        message: "Error updating location",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
