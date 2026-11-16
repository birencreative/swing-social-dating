import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { pid, image } = await req.json();
  try {
    const result = await dbPool.query(
      "SELECT * FROM public.images_insert_public_image($1,$2)",
      [pid, image]
    );

    return NextResponse.json({
      message: "Image uploaded successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Image upload failed",
      },
      { status: 400 }
    );
  }
}
