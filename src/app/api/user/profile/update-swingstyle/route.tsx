import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ProfileId, styles } = await req.json();

    if (!ProfileId || !Array.isArray(styles)) {
      return NextResponse.json(
        { message: "Missing required fields: ProfileId or styles" },
        { status: 400 }
      );
    }

    const swingStyleFormatted = styles
      .map((style) => `'${style}'`)
      .join(",");

    const query = "SELECT * FROM public.edit_profile_swingstyle($1, $2)";
    await dbPool.query(query, [ProfileId, swingStyleFormatted]);

    return NextResponse.json({
      success: true,
      message: "Swing Styles updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating swing styles:", error);
    return NextResponse.json(
      {
        message: "Error updating swing styles",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
