import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: any) {
  const { pid, targetid, newcategory } = await req.json();
  try {
    const result = await dbPool.query(
      "select * from public.insert_relationship_categoryfn($1,$2,$3)",
      [pid, targetid, newcategory]
    );

    return NextResponse.json({
      message: "Relationship Category created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Relationship Category Update failed",
      },
      { status: 400 }
    );
  }
}
