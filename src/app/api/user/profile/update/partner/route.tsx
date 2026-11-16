import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const {
      ProfileId,
      PartnerOrientation,
      PartnerBodyType,
      PartnerHairColor,
      PartnerEyeColor
    } = await req.json();

    if (!ProfileId) {
      return NextResponse.json({ message: "Profile ID is required", status: 400 });
    }

    const query = "SELECT * FROM public.edit_profile_partner_attributes($1, $2, $3, $4, $5)";
    await dbPool.query(query, [
      ProfileId,
      PartnerOrientation,
      PartnerBodyType,
      PartnerHairColor,
      PartnerEyeColor
    ]);

    return NextResponse.json({
      message: "Partner information updated successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("PARTNER UPDATE ERROR:", error);
    return NextResponse.json({
      message: "Update failed",
      error: error.message,
      status: 400,
    });
  }
}
