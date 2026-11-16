import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { profileId, latitude, longitude } = await req.json();

    if (!profileId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 },
      );
    }

    const query = "SELECT public.update_user_location_by_profile(($1)::uuid, ($2)::numeric, ($3)::numeric)";
    await dbPool.query(query, [profileId, latitude, longitude]);

    return NextResponse.json({
      success: true,
      message: "Latitude and Longitude updated successfully",
      latitude,
      longitude,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Location update failed",
        error: error.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
