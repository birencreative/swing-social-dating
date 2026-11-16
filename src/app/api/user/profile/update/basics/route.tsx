import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { 
      ProfileId, 
      Username, 
      AccountType, 
      Gender, 
      Age,
      DateOfBirth, 
      PartnerAge,
      PartnerGender, 
      PartnerDateOfBirth 
    } = await req.json();

    if (!ProfileId) {
      return NextResponse.json({ message: "Profile ID is required", status: 400 });
    }

    const query = "SELECT * FROM public.edit_profile_basic_info($1, $2, $3, $4, $5, $6, $7, $8, $9)";
    await dbPool.query(query, [
      ProfileId, 
      Username, 
      AccountType, 
      Gender, 
      Age,
      DateOfBirth, 
      PartnerAge || null,
      PartnerGender || null, 
      PartnerDateOfBirth || null 
    ]);

    return NextResponse.json({
      message: "Basic information updated successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("BASIC INFO UPDATE ERROR:", error);
    return NextResponse.json({
      message: "Update failed",
      error: error.message,
      status: 400,
    });
  }
}
