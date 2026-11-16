import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ProfileId, BodyType, HairColor, EyeColor, Orientation } = await req.json();

    if (!ProfileId) {
      return NextResponse.json({ message: "Profile ID is required", status: 400 });
    }

    const query = "SELECT * FROM public.edit_profile_physical_attributes($1, $2, $3, $4, $5)";
    await dbPool.query(query, [ProfileId, BodyType, HairColor, EyeColor, Orientation]);

    return NextResponse.json({
      message: "Physical attributes updated successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("PHYSICAL UPDATE ERROR:", error);
    return NextResponse.json({
      message: "Update failed",
      error: error.message,
      status: 400,
    });
  }
}
