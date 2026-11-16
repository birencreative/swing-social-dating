import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
import { detectNudity } from "@/lib/rekognition";
import sharp from "sharp";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { pid, banner, Questionable } = await req.json();
  try {
    let isNsfw = false;
    try {
      const imgRes = await fetch(banner);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        try {
          buffer = await sharp(buffer).jpeg().toBuffer();
        } catch (err) {
          console.warn(`Sharp image conversion failed for ${banner}`, err);
        }
        isNsfw = await detectNudity(buffer);
      }
    } catch (err) {
      console.error("Error running Rekognition on General Banner upload:", err);
    }

    const result = await dbPool.query(
      "SELECT * FROM public.web_new_banner($1, $2, $3)",
      [pid, banner, Questionable]
    );

    await dbPool.query("SELECT * FROM public.update_is_banner_nsfw($1, $2)", [pid, isNsfw]);

    return NextResponse.json({
      message: "Banner added successfully",
      isNsfw
    });
  } catch (error: any) {
    console.error("web_new_banner failed:", error);
    return NextResponse.json(
      { message: "Banner addition failed" },
      { status: 400 }
    );
  }
}
