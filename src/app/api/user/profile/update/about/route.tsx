import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ProfileId, Tagline, About } = await req.json();

    if (!ProfileId) {
      return NextResponse.json({ message: "Profile ID is required", status: 400 });
    }

    const query = "SELECT * FROM public.edit_profile_about_tagline($1, $2, $3)";
    await dbPool.query(query, [ProfileId, Tagline, About]);

    return NextResponse.json({
      message: "Profile content updated successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("ABOUT UPDATE ERROR:", error);
    return NextResponse.json({
      message: "Update failed",
      error: error.message,
      status: 400,
    });
  }
}
