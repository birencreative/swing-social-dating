import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTerm = (searchParams.get("city") || searchParams.get("state") || "").trim();

    if (!rawTerm) {
      return NextResponse.json({ cities: [] });
    }

    const searchPattern = `%${rawTerm}%`;
    const startsWithPattern = `${rawTerm}%`;

    const rawQuery = `
      SELECT "City"
      FROM (
        SELECT "City" || ', ' || "State" AS "City"
        FROM "UsCities"
        WHERE "City" ILIKE $1
           OR "State" ILIKE $1
           OR ("City" || ', ' || "State") ILIKE $1
        UNION
        SELECT "StateFull" AS "City"
        FROM "UsStates"
        WHERE "StateFull" ILIKE $1
           OR "State" ILIKE $1
      ) AS combined
      ORDER BY 
        CASE WHEN "City" ILIKE $2 THEN 0 ELSE 1 END,
        "City" ASC
      LIMIT 100
    `;

    const result = await dbPool.query(rawQuery, [searchPattern, startsWithPattern]);

    return NextResponse.json({
      cities: result.rows.map((row, i) => ({ id: i, City: row.City })),
    });
  } catch (error) {
    console.error("Error in city search:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
