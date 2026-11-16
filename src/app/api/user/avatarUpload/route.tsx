import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
import { detectNudity } from "@/lib/rekognition";
import sharp from "sharp";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { pid, avatar, Questionable } = await req.json();
  try {
    let isNsfw = false;
    try {
      const imgRes = await fetch(avatar);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        try {
          buffer = await sharp(buffer).jpeg().toBuffer();
        } catch (err) {
          console.warn(`Sharp image conversion failed for ${avatar}`, err);
        }
        isNsfw = await detectNudity(buffer);
      }
    } catch (err) {
      console.error("Error running Rekognition on General Avatar upload:", err);
    }

    const result = await dbPool.query(
      "SELECT * FROM public.web_new_avatar($1, $2, $3)",
      [pid, avatar, Questionable]
    );

    await dbPool.query("SELECT * FROM public.update_is_nsfw($1, $2)", [pid, isNsfw]);

    return NextResponse.json({
      message: "Avatar added successfully",
      isNsfw
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Avatar addition failed",
      },
      { status: 400 }
    );
  }
}
