import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
import { detectNudity } from "@/lib/rekognition";
import sharp from "sharp";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ProfileId, Banner } = await req.json();

    if (!ProfileId || !Banner) {
      return NextResponse.json(
        { message: "Missing required fields: ProfileId or Banner" },
        { status: 400 }
      );
    }

    let isNsfw = false;
    try {
      const imgRes = await fetch(Banner);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        try {
          buffer = await sharp(buffer).jpeg().toBuffer();
        } catch (err) {
          console.warn(`Sharp image conversion failed for ${Banner}`, err);
        }
        isNsfw = await detectNudity(buffer);
      }
    } catch (err) {
      console.error("Error running Rekognition on Banner upload:", err);
    }

    const query = "SELECT * FROM public.edit_profile_banner($1, $2)";
    await dbPool.query(query, [ProfileId, Banner]);

    await dbPool.query("SELECT * FROM public.update_is_banner_nsfw($1, $2)", [ProfileId, isNsfw]);

    return NextResponse.json({
      success: true,
      message: "Profile banner updated successfully",
      isNsfw
    });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { message: "Error updating profile banner", error: error.message },
      { status: 500 }
    );
  }
}
